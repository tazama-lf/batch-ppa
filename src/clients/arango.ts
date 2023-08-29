import { aql, Database } from 'arangojs';
import apm from 'elastic-apm-node';
import * as fs from 'fs';
import { configuration } from '../config';
import { type TransactionRelationship } from '../interfaces/iTransactionRelationship';
import { LoggerService } from '../logger.service';

export class ArangoDBService {
  transactionHistoryClient: Database;
  pseudonymsClient: Database;

  constructor() {
    const caOption = fs.existsSync(configuration.cert)
      ? [fs.readFileSync(configuration.cert)]
      : [];
    if (caOption.length === 0)
      LoggerService.warn('🟠 ArangoDB was not supplied with a certificate');
    this.pseudonymsClient = new Database({
      url: configuration.db.url,
      databaseName: configuration.db.pseudonymsdb,
      auth: {
        username: configuration.db.user,
        password: configuration.db.password,
      },
      agentOptions: {
        ca: caOption,
      },
    });

    this.transactionHistoryClient = new Database({
      url: configuration.db.url,
      databaseName: configuration.db.transactionhistorydb,
      auth: {
        username: configuration.db.user,
        password: configuration.db.password,
      },
      agentOptions: {
        ca: caOption,
      },
    });

    if (this.pseudonymsClient.isArangoDatabase) {
      LoggerService.log('✅ ArangoDB connection is ready');
    } else {
      LoggerService.error('❌ ArangoDB connection is not ready');
      throw new Error('ArangoDB connection is not ready');
    }
  }

  async query(query, client: Database): Promise<unknown> {
    const span = apm.startSpan(`Query in ${client.name}`);
    try {
      const cycles = await client.query(query);
      const results = await cycles.batches.all();

      span?.end();
      // LoggerService.log(`Query result: ${JSON.stringify(results)}`);

      return results;
    } catch (error) {
      LoggerService.error(
        'Error while executing query from arango with message:',
        error as Error,
        'ArangoDBService',
      );
      throw new Error(
        `Error while executing query from arango with message: ${JSON.stringify(
          error as Error,
        )}`,
      );
    }
  }

  async save(
    client: Database,
    collectionName: string,
    data: unknown,
    saveOptions?: unknown,
  ): Promise<void> {
    const span = apm.startSpan(
      `Save ${collectionName} document in ${client.name}`,
    );
    try {
      await client
        .collection(collectionName)
        .save(data, saveOptions || undefined);
      span?.end();
    } catch (error) {
      LoggerService.error(
        `Error while saving data to collection ${collectionName} with document\n ${JSON.stringify(
          data,
        )}`,
      );
      if (saveOptions)
        LoggerService.error(
          `With save options: ${JSON.stringify(saveOptions)}`,
        );
      LoggerService.error(JSON.stringify(error));
      throw new Error(
        `Error while saving data to collection ${collectionName}`,
      );
    }
  }

  async getPseudonyms(hash: string): Promise<unknown> {
    const db = this.pseudonymsClient.collection(
      configuration.db.pseudonymscollection,
    );
    const query = aql`FOR i IN ${db}
        FILTER i.pseudonym == ${hash}
        RETURN i`;

    return await this.query(query, this.pseudonymsClient);
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

    return (await this.query(
      query,
      this.transactionHistoryClient,
    )) as string[][];
  }

  async UpdatePseudonymEdgesTimestamp(): Promise<void> {
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
      await this.query(queryPacs001, this.pseudonymsClient);
      await this.query(queryPacs013, this.pseudonymsClient);
      await this.query(queryPacs008, this.pseudonymsClient);
    } catch {
      throw new Error(
        `Error trying to shift timestap of transaction relationships`,
      );
    }
  }

  async SyncPacs002AndTransaction(): Promise<void> {
    const removeNoReportPacs002 = aql`
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
    const removeReportNoPacs002 = aql`
      LET pacs002List = (
        FOR doc IN transactionHistoryPacs002
         RETURN doc.EndToEndId
        )

        LET reportNoPacs002 = (
        FOR report IN transactions
            FILTER report.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId NOT IN pacs002List
            RETURN report.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId
        )

        FOR transactionD IN transactions
            FILTER transactionD.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId IN reportNoPacs002
            REMOVE transactionD IN transactions
        `;

    const reportList = aql`
            FOR report IN transactions
            RETURN report.transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId`;

    const lisOfReports = await this.query(
      reportList,
      this.transactionHistoryClient,
    );

    const removeEdgeNoReport = aql`
        FOR edgeDel IN transactionRelationship
            FILTER edgeDel.TxTp == "pacs.002.001.12"
            AND edgeDel.EndToEndId NOT IN ${
              lisOfReports && lisOfReports[0] ? lisOfReports[0] : ['']
            }
            REMOVE edgeDel IN transactionRelationship`;

    Promise.all([
      // await this.query(removeEdgeNoReport, this.pseudonymsClient),
      await this.query(removeNoReportPacs002, this.transactionHistoryClient),
      await this.query(removeReportNoPacs002, this.transactionHistoryClient),
    ]);
  }

  async RemovePacs002Pseudonym(): Promise<void> {
    const dbPacs002 = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pacs002_collection,
    );
    const pacs002TransactionHistoryQuery = aql`
                                  FOR pacs002 IN ${dbPacs002}
                                  REMOVE pacs002 IN ${dbPacs002}`;

    const pacs002PseudonymQuery = aql`FOR pacs002 IN transactionRelationship
                                  FILTER pacs002.TxTp == "pacs.002.001.12"
                                  REMOVE pacs002 IN transactionRelationship`;

    const removeReportQuery = aql`FOR reports IN transactions
                                  REMOVE reports IN transactions`;

    await this.query(
      pacs002TransactionHistoryQuery,
      this.transactionHistoryClient,
    );
    await this.query(pacs002PseudonymQuery, this.pseudonymsClient);
    await this.query(removeReportQuery, this.transactionHistoryClient);
  }

  async UpdateHistoryTransactionsTimestamp(): Promise<void> {
    const dbPacs008 = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pacs008_collection,
    );
    const dbPain013 = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pain013_collection,
    );
    const dbPain001 = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pain001_collection,
    );
    const queryPacs008 = aql`LET newestPacs008 = (
                                FOR pacs008 IN ${dbPacs008}
                                    SORT pacs008.FIToFICstmrCdt.GrpHdr.CreDtTm DESC
                                    LIMIT 1
                                RETURN pacs008
                            )
                            LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPacs008[0].FIToFICstmrCdt.GrpHdr.CreDtTm), DATE_NOW(), "millisecond", false)
                            FOR doc IN ${dbPacs008}
                                LET newDoc = {"GrpHdr": {"CreDtTm": DATE_ADD(DATE_TIMESTAMP(doc.FIToFICstmrCdt.GrpHdr.CreDtTm), timeDeltaToNow, "millisecond")}}
                              UPDATE doc WITH { FIToFICstmrCdtTrf: MERGE(doc.FIToFICstmrCdt, newDoc) } IN ${dbPacs008}`;

    const queryPacs013 = aql`LET newestPain013 = (
                          FOR pain013 IN ${dbPain013}
                              SORT pain013.CdtrPmtActvtnReq.GrpHdr.CreDtTm DESC
                              LIMIT 1
                          RETURN pain013
                      )

                      LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPain013[0].CdtrPmtActvtnReq.GrpHdr.CreDtTm), DATE_NOW(), "millisecond", false)

                      FOR doc IN ${dbPain013}
                          LET newDoc = {"GrpHdr": {"CreDtTm": DATE_ADD(DATE_TIMESTAMP(doc.CdtrPmtActvtnReq.GrpHdr.CreDtTm), timeDeltaToNow, "millisecond")}}
                      UPDATE doc WITH { CdtrPmtActvtnReq: MERGE(doc.CdtrPmtActvtnReq, newDoc) } IN ${dbPain013}`;

    const queryPacs001 = aql`LET newestPain001 = (
                            FOR pain001 IN ${dbPain001}
                                SORT pain001.CstmrCdtTrfInitn.GrpHdr.CreDtTm DESC
                                LIMIT 1
                            RETURN pain001
                        )

                        LET timeDeltaToNow = DATE_DIFF(DATE_TIMESTAMP(newestPain001[0].CstmrCdtTrfInitn.GrpHdr.CreDtTm), DATE_NOW(), "millisecond", false)

                        FOR doc IN ${dbPain001}
                            LET newDoc = {"GrpHdr": {"CreDtTm": DATE_ADD(DATE_TIMESTAMP(doc.CstmrCdtTrfInitn.GrpHdr.CreDtTm), timeDeltaToNow, "millisecond")}}
                        UPDATE doc WITH { CstmrCdtTrfInitn: MERGE(doc.CstmrCdtTrfInitn, newDoc) } IN ${dbPain001}`;

    try {
      await this.query(queryPacs001, this.transactionHistoryClient);
      await this.query(queryPacs013, this.transactionHistoryClient);
      await this.query(queryPacs008, this.transactionHistoryClient);
    } catch {
      throw new Error(
        `Error while trying to shift timestamp of transactions history`,
      );
    }
  }

  async getOldestTimestampPacs008(): Promise<Date> {
    const db = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pacs008_collection,
    );
    const query = aql`
        FOR pacs008 IN ${db}
        SORT pacs008.FIToFICstmrCdt.GrpHdr.CreDtTm ASC
        LIMIT 1
        RETURN pacs008.FIToFICstmrCdt.GrpHdr.CreDtTm`;

    try {
      return (
        (await this.query(query, this.transactionHistoryClient)) as Date
      )[0][0];
    } catch {
      throw new Error(
        `Error while trying to retrieve oldest timestamp pacs008`,
      );
    }
  }

  async getTransactionHistoryPacs008(EndToEndId: string): Promise<unknown> {
    const db = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pacs008_collection,
    );
    const query = aql`FOR doc IN ${db}
      FILTER doc.EndToEndId == ${EndToEndId}
      RETURN doc`;

    return await this.query(query, this.transactionHistoryClient);
  }

  async getTransactionReport(EndToEndId: string): Promise<unknown> {
    const db = this.transactionHistoryClient.collection('transactions');
    const query = aql`FOR doc IN ${db}
      FILTER doc.transaction.EndToEndId == ${EndToEndId}
      RETURN doc`;

    return await this.query(query, this.transactionHistoryClient);
  }

  async addAccount(hash: string): Promise<void> {
    await this.save(
      this.pseudonymsClient,
      'accounts',
      { _key: hash },
      { overwriteMode: 'ignore' },
    );
  }

  async addEntity(entityId: string, CreDtTm: string): Promise<void> {
    await this.save(
      this.pseudonymsClient,
      'entities',
      {
        _key: entityId,
        Id: entityId,
        CreDtTm,
      },
      { overwriteMode: 'ignore' },
    );
  }

  async addAccountHolder(
    entityId: string,
    accountId: string,
    CreDtTm: string,
  ): Promise<void> {
    await this.save(
      this.pseudonymsClient,
      'account_holder',
      {
        _key: `${accountId}${entityId}`,
        _from: `entities/${entityId}`,
        _to: `accounts/${accountId}`,
        CreDtTm,
      },
      { overwriteMode: 'ignore' },
    );
  }

  async saveTransactionRelationship(
    tR: TransactionRelationship,
  ): Promise<void> {
    await this.save(
      this.pseudonymsClient,
      'transactionRelationship',
      {
        _key: tR.MsgId,
        _from: tR.from,
        _to: tR.to,
        TxTp: tR.TxTp,
        CreDtTm: tR.CreDtTm,
        Amt: tR.Amt,
        Ccy: tR.Ccy,
        PmtInfId: tR.PmtInfId,
        EndToEndId: tR.EndToEndId,
        lat: tR.lat,
        long: tR.long,
      },
      { overwriteMode: '' },
    );
  }

  async saveTransactionHistory(
    transaction: unknown,
    transactionhistorycollection: string,
  ): Promise<void> {
    await this.save(
      this.transactionHistoryClient,
      transactionhistorycollection,
      transaction,
      {
        overwriteMode: 'ignore',
      },
    );
  }

  async getTransactionPain001(endToEnd: string): Promise<unknown> {
    const db = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pain001_collection,
    );
    const query = aql`FOR doc IN ${db}
      FILTER doc.EndToEndId == ${endToEnd}
      RETURN doc`;
    return await this.query(query, this.transactionHistoryClient);
  }

  async savePseudonym(pseudonym: unknown): Promise<void> {
    await this.save(
      this.pseudonymsClient,
      configuration.db.pseudonymscollection,
      pseudonym,
      {
        overwriteMode: 'ignore',
      },
    );
  }
}
