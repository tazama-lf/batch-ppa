# Batch PPA Documentation

- [Batch PPA Documentation](#batch-ppa-documentation)
  - [Introduction](#introduction)
  - [1. Installation](#1-installation)
  - [2. Configuration](#2-configuration)
  - [3. Sending Batch Messages](#3-sending-batch-messages)
    - [Step 1: /v1/uploadfile](#step-1-v1uploadfile)
    - [Step 2: /v1/executebatch `POST`](#step-2-v1executebatch-post)
  - [3.1 Sending Preparation Messages](#31-sending-preparation-messages)
  - [3.2 Sending PACS002 Messages](#32-sending-pacs002-messages)
  - [4. Error Handling](#4-error-handling)
  - [5 Batch Input File](#5-batch-input-file)
    - [5.1 File format](#51-file-format)
    - [5.2 Expected File Fields](#52-expected-file-fields)

## Introduction

Welcome to the Batch PPA Node.js application documentation. This application enables batch sending of various payment messages to the Tazama system, including preparation messages like PAIN001, PACS008, and PAIN013. Additionally, the application supports sending PACS002 messages into the Tazama platform for Fraud evaluation.

## 1. Installation

To install the Batch PPA application, follow these steps:

1. Clone the repository: ```git clone https://github.com/tazama-lf/batch-ppa.git```
2. Navigate to the application folder: ```cd batch-ppa```
3. Install dependencies: ```npm install```

## 2. Configuration

Before using the application, configure it by editing the `.env.template` file. This file contains essential settings, such as environment variables for required services like Arango, APM, and others. After editing, rename the file to `.env`.

[batch-ppa/.env.template at main · Tazama-lf/batch-ppa (github.com)](https://github.com/tazama-lf/batch-ppa/blob/dev/.env.template)

## 3. Sending Batch Messages

### Step 1: /v1/uploadfile

To initiate batch execution, upload the source file containing transaction records to the server-side host. The file should be delimited by ‘|’ and include the transaction fields specified in section 5.2.

For uploading, use a tool like Postman, which supports requests with form-data in the body and allows file attachments. Ensure that the file does not exceed 100 MB, which typically accommodates 100,000 transactions by default. This limit can be adjusted by setting the `MAX_FILE_SIZE` in your environment variables.

Configuration steps:
1. Set the endpoint to `{yourhost}/v1/uploadfile` and use the HTTP method `POST`.
2. Attach the file using the key name "batch"
3. Send the request and wait for the file to upload completly before moving to Step 2.

### Step 2: /v1/executebatch `POST`

Batch PPA executes the batch in two stages. The first stage sends preparation messages, including PAIN001, PAIN013, and PACS008. The second stage sends PACS002 messages to generate Tazama reports.

## 3.1 Sending Preparation Messages

The Batch PPA application can send a batch of preparation messages. Use a request tool like Postman and configure the request as follows:

- Set the method to `POST` and point the address to `{yourhost}/v1/executebatch`.
- In the body, set `"evaluate": false` to initiate basic preparation.

The application will iterate through the list of preparation messages and send them to the Arango database.


## 3.2 Sending PACS002 Messages

Sending PACS002 messages requires a fully operational Tazama system, as this step generates the report. To trigger the sending of PACS002, set `"evaluate": true` in the request body. This will propagate data for reports and PACS002 messages in the database, allowing you to retrieve batch reports.

- Set the method to `POST` and point the address to `{yourhost}/v1/executebatch`.
- In the body, set `"evaluate": true` to initiate basic preparation.

## 4. Error Handling

The application includes error-handling mechanisms to capture and report errors during message sending and conversion. Be sure to review error logs for troubleshooting. In a non-production environment, errors will be logged to the console. However, if you have integrated with the Tazama logging system, use the appropriate guard to access your logs [link](https://github.com/tazama-lf/docs/blob/dev/Technical/Logging/Logging-Data-View.md). 

## 5 Batch Input File

### 5.1 File format

The supported input batch file should contain a list of transactions, with each field structured as outlined in Section 5.2 and separated by `|`. The first line will be included only if the `PROCESSING_DATE` is valid.

### 5.2 Expected File Fields
The file should contain the following fields, delimited by `|`:

```
PROCESSING_DATE_TIME|MESSAGE_ID|TRANSACTION_TYPE|PAYMENT_CURRENCY_CODE|TOTAL_PAYMENT_AMOUNT|SENDER_NAME|RECEIVER_NAME|SENDER_AGENT_SPID|RECEIVER_AGENT_SPID|SENDER_ACCOUNT|RECEIVER_ACCOUNT|REPORTING_CODE
```

| Source field |	Target Field |	Description |
| ------------ | ------------ | ------------ |
| PROCESSING_DATE_TIME |	CreDtTm	| Date and time at which the message was created. |
| MESSAGE_ID |	EndToEndId | The end-to-end identification can be used for reconciliation or to link tasks relating to the transaction. It can be included in several messages related to the transaction. |
| TRANSACTION_TYPE |	PmtTpInf.CtgyPurp.Prtry | Underlying reason for the payment transaction. |
| PAYMENT_CURRENCY_CODE |	InstdAmt.Amt.Ccy | The currency of the instructed amount as ordered by the initiating party. |
| TOTAL_PAYMENT_AMOUNT |	InstdAmt.Amt.Amt | Amount of money to be moved between the debtor and creditor, before deduction of charges, expressed in the currency as ordered by the initiating party. |
| SENDER_ID |	Dbtr.Id | Unique identifier by which the debtor is known and which is usually used to identify that party. |
| SENDER_NAME |	Dbtr.Nm | Name by which the debtor is known and which is usually used to identify that party. |
| RECEIVER_ID |	Cdtr.Id |	Unique identifier by which the creditor is known and which is usually used to identify that party. |
| RECEIVER_NAME |	Cdtr.Nm |	Name by which the creditor is known and which is usually used to identify that party. |
| SENDER_AGENT_SPID |	DbtrAgt.FinInstnId.ClrSysMmbId.MmbId | Unique and unambiguous identification of the financial institution servicing an account for the debtor, as assigned under an internationally recognised or proprietary identification scheme. |
| RECEIVER_AGENT_SPID |	DbtrAgt.FinInstnId.ClrSysMmbId.MmbId |	Unique and unambiguous identification of the financial institution servicing an account for the creditor, as assigned under an internationally recognised or proprietary identification scheme. |
| SENDER_ACCOUNT |	DbtrAcct.Id.Othr.Id| Unambiguous identification of the account of the debtor to which a debit entry will be made as a result of the transaction. |
| RECEIVER_ACCOUNT |	CdtrAcct.Id.Othr.Id | Unambiguous identification of the account of the creditor to which a credit entry will be made as a result of the transaction. |
| REPORTING_CODE |	RgltryRptg.Dtls.Cd |Specifies the nature, purpose, and reason for the transaction to be reported for regulatory and statutory requirements in a coded form. |