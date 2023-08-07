import { aql, Database } from 'arangojs';
import apm from 'elastic-apm-node';
import * as fs from 'fs';
import { configuration } from '../config';
import { type TransactionRelationship } from '../interfaces/iTransactionRelationship';
import { LoggerService } from '../logger.service';
import { type Pain001 } from '../classes/pain.001.001.11';
import { type Pain013 } from '../classes/pain.013.001.09';
import { type Pacs002 } from '../classes/pacs.002.001.12';
import { type Pacs008 } from '../classes/pacs.008.001.10';
import { type GeneratedAqlQuery } from 'arangojs/aql';

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

  async getRelatedMessages(
    messageIds: string[],
    MessageType: string,
  ): Promise<Pain001[] | Pain013[] | Pacs002[] | Pacs008[]> {
    let collection: string;
    let filter: GeneratedAqlQuery;

    switch (MessageType) {
      case 'pain001':
        collection = configuration.db.transactionhistory_pain001_collection;
        filter = aql` FILTER doc.CstmrCdtTrfInitn.PmtInf.PmtInfId IN ${messageIds}`;
        break;
      case 'pain013':
        collection = configuration.db.transactionhistory_pain013_collection;
        filter = aql` FILTER doc.CdtrPmtActvtnReq.PmtInf.PmtInfId IN ${messageIds}`;
        break;
      case 'pacs008':
        collection = configuration.db.transactionhistory_pacs008_collection;
        filter = aql` FILTER doc.FIToFICstmrCdt.CdtTrfTxInf.PmtId.InstrId IN ${messageIds}`;
        break;
      default:
        throw new Error('Message type was not correctly specified');
    }

    const db = this.transactionHistoryClient.collection(collection);
    const query = aql`FOR doc IN ${db}
        ${filter}
        RETURN doc`;

    try {
      return (
        (await this.query(query, this.transactionHistoryClient)) as
          | Pain013
          | Pain001
          | Pacs008
      )[0];
    } catch {
      throw new Error(`Error messages for provided message ids`);
    }
  }

  async getRelatedPain013(messageId: string): Promise<Pain013> {
    const db = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pain013_collection,
    );
    const query = aql`FOR doc IN ${db}
        FILTER doc.CdtrPmtActvtnReq.PmtInf.PmtInfId == ${messageId}
        RETURN doc`;
    try {
      return (
        (await this.query(query, this.transactionHistoryClient)) as Pain013
      )[0][0];
    } catch {
      throw new Error(
        `Error trying to retrieve Pain013 for current pacs008 try preparing for this transaction - ${messageId}`,
      );
    }
  }

  async getRelatedPain001(messageId: string): Promise<Pain001> {
    const db = this.transactionHistoryClient.collection(
      configuration.db.transactionhistory_pain001_collection,
    );
    const query = aql`FOR doc IN ${db}
        FILTER doc.CstmrCdtTrfInitn.PmtInf.PmtInfId == ${messageId}
        RETURN doc`;

    try {
      return (
        (await this.query(query, this.transactionHistoryClient)) as Pain001
      )[0][0];
    } catch {
      throw new Error(
        `Error trying to retrieve Pain001 for current pacs008 try preparing for this transaction - ${messageId}`,
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
