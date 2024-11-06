// SPDX-License-Identifier: Apache-2.0
import { aql } from '@tazama-lf/frms-coe-lib';
import { Database } from '@tazama-lf/frms-coe-lib/lib/config/database.config';
import { Cache } from '@tazama-lf/frms-coe-lib/lib/config/redis.config';
import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import {
  type Pacs002,
  type Pacs008,
  type Pain001,
  type Pain013,
  type TransactionRelationship,
} from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { CreateStorageManager, type DatabaseManagerInstance, type ManagerConfig } from '@tazama-lf/frms-coe-lib/lib/services/dbManager';
import { configuration } from '..';
import { type Configuration } from '../config';

export class CacheDatabaseService<T extends ManagerConfig> {
  private readonly dbManager: DatabaseManagerInstance<T>;

  cacheExpireTime: number;

  private constructor(dbInstance: DatabaseManagerInstance<T>, expire: number) {
    this.dbManager = dbInstance;
    this.cacheExpireTime = expire;
  }

  /**
   * Creates a wrapper database for adding optional caching to dbManager library.
   * Missing methods will have to be added by manually
   *
   * @static
   * @param {unknown} db frms-coe-lib dbManager instance
   * @param {number} expire cache expire time
   * @return {*}  {Promise<CacheDatabaseService>}
   * @memberof CacheDatabaseService
   */
  public static async create<T extends ManagerConfig>(
    configuration: Configuration,
  ): Promise<{ db: CacheDatabaseService<T>; config: ManagerConfig }> {
    const auth = configuration.nodeEnv === 'production';
    const { db, config } = await CreateStorageManager(
      [Database.EVALUATION, Database.TRANSACTION_HISTORY, Database.PSEUDONYMS, Cache.DISTRIBUTED],
      auth,
    );
    const databaseManager = db as DatabaseManagerInstance<T>;
    return { db: new CacheDatabaseService<T>(databaseManager, config.redisConfig?.distributedCacheTTL ?? 0), config };
  }

  /**
   * Wrapper method for dbManager.quit;
   *
   * @memberof CacheDatabaseService
   */
  quit = (): void => {
    this.dbManager.quit?.();
  };

  /**
   * Wrapper method for dbManager.getTransactionPacs008
   *
   * @param {string} EndToEndId
   * @return {*}  {Promise<unknown>}
   * @memberof CacheDatabaseService
   */
  async getTransactionPacs008(EndToEndId: string): Promise<unknown> {
    const pacs008 = await this.dbManager.getTransactionPacs008(EndToEndId);
    return pacs008;
  }

  async getOldestTimestampPacs008(): Promise<Date> {
    const colPacs008 = configuration.TRANSACTION_HISTORY_PACS008_COLLECTION;
    const query = aql`
        FOR pacs008 IN ${colPacs008}
        SORT pacs008.FIToFICstmrCdtTrf.GrpHdr.CreDtTm ASC
        LIMIT 1
        RETURN pacs008.FIToFICstmrCdtTrf.GrpHdr.CreDtTm`;

    try {
      const date = await this.dbManager._transactionHistory.query(query);
      return date;
    } catch {
      throw new Error('Error while trying to retrieve oldest timestamp pacs008');
    }
  }

  async updateHistoryTransactionsTimestamp(): Promise<void> {
    const colPacs008 = configuration.TRANSACTION_HISTORY_PACS008_COLLECTION;
    const colPain013 = configuration.TRANSACTION_HISTORY_PAIN013_COLLECTION;
    const colPain001 = configuration.TRANSACTION_HISTORY_PAIN001_COLLECTION;
    const queryPacs008 = aql`LET newestPacs008 = (
                                FOR pacs008 IN ${colPacs008}
                                    SORT pacs008.FIToFICstmrCdtTrf.GrpHdr.CreDtTm DESC
                                    LIMIT 1
                                RETURN pacs008
                            )
                            LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPacs008[0].FIToFICstmrCdtTrf.GrpHdr.CreDtTm), DATE_NOW(), "millisecond", false)
                            FOR doc IN ${colPacs008}
                                LET newDoc = {"GrpHdr": {"CreDtTm": DATE_ADD(DATE_TIMESTAMP(doc.FIToFICstmrCdtTrf.GrpHdr.CreDtTm), timeDeltaToNow, "millisecond")}}
                              UPDATE doc WITH { FIToFICstmrCdtTrfTrf: MERGE(doc.FIToFICstmrCdtTrf, newDoc) } IN ${colPacs008}`;

    const queryPacs013 = aql`LET newestPain013 = (
                          FOR pain013 IN ${colPain013}
                              SORT pain013.CdtrPmtActvtnReq.GrpHdr.CreDtTm DESC
                              LIMIT 1
                          RETURN pain013
                      )

                      LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPain013[0].CdtrPmtActvtnReq.GrpHdr.CreDtTm), DATE_NOW(), "millisecond", false)

                      FOR doc IN ${colPain013}
                          LET newDoc = {"GrpHdr": {"CreDtTm": DATE_ADD(DATE_TIMESTAMP(doc.CdtrPmtActvtnReq.GrpHdr.CreDtTm), timeDeltaToNow, "millisecond")}}
                      UPDATE doc WITH { CdtrPmtActvtnReq: MERGE(doc.CdtrPmtActvtnReq, newDoc) } IN ${colPain013}`;

    const queryPacs001 = aql`LET newestPain001 = (
                            FOR pain001 IN ${colPain001}
                                SORT pain001.CstmrCdtTrfInitn.GrpHdr.CreDtTm DESC
                                LIMIT 1
                            RETURN pain001
                        )

                        LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPain001[0].CstmrCdtTrfInitn.GrpHdr.CreDtTm), DATE_NOW(), "millisecond", false)

                        FOR doc IN ${colPain001}
                            LET newDoc = {"GrpHdr": {"CreDtTm": DATE_ADD(DATE_TIMESTAMP(doc.CstmrCdtTrfInitn.GrpHdr.CreDtTm), timeDeltaToNow, "millisecond")}}
                        UPDATE doc WITH { CstmrCdtTrfInitn: MERGE(doc.CstmrCdtTrfInitn, newDoc) } IN ${colPain001}`;

    try {
      await Promise.all([
        this.dbManager._transactionHistory.query(queryPacs008),
        this.dbManager._transactionHistory.query(queryPacs013),
        this.dbManager._transactionHistory.query(queryPacs001),
      ]);
    } catch {
      throw new Error('Error while trying to shift timestamp of transactions history');
    }
  }

  async updatePseudonymEdgesTimestamp(): Promise<void> {
    const queryPacs008 = aql`
    LET newestPacs008 = (
        FOR pacs008 IN transactionRelationship
            FILTER pacs008.TxTp == "pacs.008.001.10"
            SORT pacs008.CreDtTm DESC
            LIMIT 1
        RETURN pacs008
    )

    LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPacs008[0].CreDtTm), DATE_NOW(), "millisecond", false)

    FOR doc IN transactionRelationship
        FILTER doc.TxTp == "pacs.008.001.10"
    UPDATE doc WITH { CreDtTm: DATE_ADD(DATE_TIMESTAMP(doc.CreDtTm), timeDeltaToNow, "millisecond") } IN transactionRelationship
    `;

    const queryPacs013 = aql`
        LET newestPain013 = (
            FOR pain013 IN transactionRelationship
                FILTER pain013.TxTp == "pain.013.001.09"
                SORT pain013.CreDtTm DESC
                LIMIT 1
            RETURN pain013
        )

        LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPain013[0].CreDtTm), DATE_NOW(), "millisecond", false)

        FOR doc IN transactionRelationship
            FILTER doc.TxTp == "pain.013.001.09"
        UPDATE doc WITH { CreDtTm: DATE_ADD(DATE_TIMESTAMP(doc.CreDtTm), timeDeltaToNow, "millisecond") } IN transactionRelationship
        `;

    const queryPacs001 = aql`
      LET newestPain001 = (
          FOR pain001 IN transactionRelationship
              FILTER pain001.TxTp == "pain.001.001.11"
              SORT pain001.CreDtTm DESC
              LIMIT 1
          RETURN pain001
      )

      LET newestPain013 = (
          FOR pain013 IN transactionRelationship
              SORT pain013.CreDtTm DESC
              LIMIT 1
          RETURN pain013
      )

      LET newestPacs008 = (
          FOR pacs008 IN transactionRelationship
              SORT pacs008.CreDtTm DESC
              LIMIT 1
          RETURN pacs008
      )

      LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPain001[0].CreDtTm), DATE_NOW(), "millisecond", false)

      FOR doc IN transactionRelationship
          FILTER doc.TxTp == "pain.001.001.11"
      UPDATE doc WITH { CreDtTm: DATE_ADD(DATE_TIMESTAMP(doc.CreDtTm), timeDeltaToNow, "millisecond") } IN transactionRelationship
      `;

    try {
      await Promise.all([
        this.dbManager._pseudonymsDb.query(queryPacs008),
        this.dbManager._pseudonymsDb.query(queryPacs013),
        this.dbManager._pseudonymsDb.query(queryPacs001),
      ]);
    } catch {
      throw new Error('Error trying to shift timestamp of transaction relationships');
    }
  }

  async removePacs002Pseudonym(): Promise<void> {
    const colPacs002 = configuration.TRANSACTION_HISTORY_PACS002_COLLECTION;
    const pacs002TransactionHistoryQuery = aql`
                                  FOR pacs002 IN ${colPacs002}
                                  REMOVE pacs002 IN ${colPacs002}`;

    const pacs002PseudonymQuery = aql`FOR pacs002 IN transactionRelationship
                                  FILTER pacs002.TxTp == "pacs.002.001.12"
                                  REMOVE pacs002 IN transactionRelationship`;

    const removeReportQuery = aql`FOR reports IN transactions
                                  REMOVE reports IN transactions`;

    await Promise.all([
      await this.dbManager._transactionHistory.query(pacs002TransactionHistoryQuery),
      await this.dbManager._pseudonymsDb.query(pacs002PseudonymQuery),
      await this.dbManager._transaction.query(removeReportQuery),
    ]);
  }

  async getUnExistingTransactions(endToEndIds: string[]): Promise<string[][]> {
    const query = aql`LET refArr = (${endToEndIds})

                                    LET postedArr = (
                                        FOR doc IN transactions
                                        RETURN doc.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId
                                    )

                                    FOR doc IN refArr
                                        FILTER doc NOT IN postedArr
                                    RETURN doc`;

    return (await this.dbManager._transaction.query(query)) as string[][];
  }

  async getTransactionReport(EndToEndId: string): Promise<unknown> {
    const query = aql`FOR doc IN transactions
      FILTER doc.transaction.EndToEndId == ${EndToEndId}
      RETURN doc`;

    return this.dbManager._transaction.query(query);
  }

  async syncPacs002AndTransaction(): Promise<void> {
    const removeNoReportPacs002 = `
    LET pacs002List = (
      FOR report IN transactions
       RETURN report.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId
      )

      LET pacs002NoReport = (
      FOR pacs002 IN  transactionHistoryPacs002
          FILTER pacs002.EndToEndId NOT IN pacs002List
          RETURN pacs002.EndToEndId
      )

      FOR pacs002D IN transactionHistoryPacs002
          FILTER pacs002D.EndToEndId IN pacs002NoReport
          REMOVE pacs002D IN transactionHistoryPacs002
      `;
    const removeReportNoPacs002 = `
      LET pacs002List = (
        FOR doc IN transactionHistoryPacs002
         RETURN doc.EndToEndId
        )

        LET reportNoPacs002 = (
        FOR report IN transactions
            FILTER report.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId NOT IN pacs002List
            RETURN report.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId
        )

        FOR transaction IN transactions
            FILTER transaction.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId IN reportNoPacs002
            REMOVE transaction IN transactions
        `;

    await Promise.all([
      await this.dbManager._transactionHistory.query(removeNoReportPacs002),
      await this.dbManager._transaction.query(removeReportNoPacs002),
    ]);
  }

  /**
   * Wrapper method for dbManager.saveAccount
   *
   * @param {string} hash
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async addAccount(hash: string): Promise<void> {
    await this.dbManager.saveAccount(hash);
  }

  /**
   * Wrapper method for dbManager.saveEntity
   *
   * @param {string} entityId
   * @param {string} CreDtTm
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async addEntity(entityId: string, CreDtTm: string): Promise<void> {
    await this.dbManager.saveEntity(entityId, CreDtTm);
  }

  /**
   * Wrapper method for dbManager.saveAccountHolder
   *
   * @param {string} entityId
   * @param {string} accountId
   * @param {string} CreDtTm
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async addAccountHolder(entityId: string, accountId: string, CreDtTm: string): Promise<void> {
    await this.dbManager.saveAccountHolder(entityId, accountId, CreDtTm);
  }

  /**
   * Wrapper method for dbManager.saveTransactionRelationship
   *
   * @param {TransactionRelationship} tR
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async saveTransactionRelationship(tR: TransactionRelationship): Promise<void> {
    await this.dbManager.saveTransactionRelationship(tR);
  }

  /**
   * Wrapper method for dbManager.saveTransactionHistory with additional pre-caching
   *
   * @param {(Pain001 | Pain013 | Pacs008 | Pacs002)} transaction
   * @param {string} transactionHistoryCollection
   * @param {string} [redisKey=''] Optional key if we want to pre-cache the transaction to redis
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async saveTransactionHistory(
    transaction: Pain001 | Pain013 | Pacs008 | Pacs002,
    transactionHistoryCollection: string,
    redisKey = '',
  ): Promise<void> {
    const buff = createMessageBuffer({ ...transaction });

    if (redisKey && buff) await this.dbManager.set(redisKey, buff, this.cacheExpireTime);

    await this.dbManager.saveTransactionHistory(transaction, transactionHistoryCollection);
  }

  /**
   * Wrapper method for dbManager.set
   *
   * @param {string} key
   * @param {string | number | Buffer} value
   * @param {number} expire
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async set(key: string, value: string | number | Buffer, expire: number): Promise<void> {
    await this.dbManager.set(key, value, expire);
  }

  /**
   * Wrapper method for dbManager.getBuffer
   *
   * @param {string} key
   * @return {*}  {Promise<Record<string, unknown>>}
   * @memberof CacheDatabaseService
   */
  async getBuffer(key: string): Promise<Record<string, unknown>> {
    const buf = await this.dbManager.getBuffer(key);
    return buf;
  }

  /**
   * Wrapper method for dbManager.isReadyCheck
   *
   * @return {*}  {Promise<Record<string, unknown>>}
   * @memberof CacheDatabaseService
   */
  async isReadyCheck(): Promise<Record<string, unknown>> {
    const ready = await this.dbManager.isReadyCheck();
    return ready;
  }
}
