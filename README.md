# Batch PPA Documentation

- [Batch PPA Documentation](#batch-ppa-documentation)
  - [Introduction](#introduction)
  - [1. Installation](#1-installation)
  - [2. Configuration](#2-configuration)
  - [3. Sending Batch Messages](#3-sending-batch-messages)
    - [Step 1: /v1/uploadfile](#step-1-uploadfile)
    - [Step 2: /v1/executebatch](#step-2-executebatch)
  - [3.1 Sending Preparation Messages](#31-sending-preparation-messages)
  - [3.2 Sending PACS002 Messages](#32-sending-pacs002-messages)
  - [3.3 Resending PACS002 Messages](#33-resending-pacs002-messages)
  - [4. Error Handling](#4-error-handling)
  - [5. Batch Input file](#5-batch-input-file)
  - [6. Conclusion](#6-conclusion)

## Introduction

Welcome to the Batch PPA Node.js application documentation. This application enables batch sending of various payment messages to the Tazama system, including preparation messages like PAIN001, PACS008, and PAIN013. Additionally, the application supports resending missing PACS002 messages, comparing reports, and managing the messages.

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
3. Send the request and wait for the batch process to complete before moving to Step 2.

### Step 2: /v1/executebatch

Batch PPA executes the batch in two stages. The first stage sends preparation messages, including PAIN001, PAIN013, and PACS008. The second stage sends PACS002 messages to generate Tazama reports.

## 3.1 Sending Preparation Messages

The Batch PPA application can send a batch of preparation messages. Use a request tool like Postman and configure the request as follows:

- Set the method to `POST` and point the address to `{yourhost}/v1/executebatch`.
- In the body, set `"evaluate": false` to initiate basic preparation.

The application will iterate through the list of preparation messages and send them to the Arango database.

## 3.2 Sending PACS002 Messages

Sending PACS002 messages requires a fully operational Tazama system, as this step generates the report. To trigger the sending of PACS002, set `"evaluate": true` in the request body. This will propagate data for reports and PACS002 messages in the database, allowing you to retrieve batch reports.

## 3.3 Resending PACS002 Messages

To retry missed transactions, set `"evaluate.overwrite": true` in the request body. The service will attempt resending based on the `RETRY` variable specified in the configuration. After retrying, there may still be missed transactions, which will require resending the execute request with the same options enabled.

Retries will occur only if the number of transactions in the final report does not match the original source file count. Changing the source file may affect the missed transaction count evaluation.

## 4. Error Handling

The application includes error-handling mechanisms to capture and report errors during message sending and conversion. Be sure to review error logs for troubleshooting. In a non-production environment, errors will be logged to the console. However, if you have integrated with the Tazama logging system, use the appropriate guard to access your logs [link](https://github.com/tazama-lf/docs/blob/dev/Technical/Logging/Logging-Data-View.md). 

## 5 Batch Input File

### 5.1 File formate

The supported input batch file should contain a list of transactions, with each field structured as outlined in Section 5.2 and separated by `|`. The first line will be included only if the `PROCESSING_DATE` is valid.

### 5.2 Expected File Fields
The file should contain the following fields, delimited by `|`:

```
PROCESSING_DATE_TIME|PROCESSING_WINDOW|MESSAGE_ID|TRANSACTION_TYPE|TCIBTXID|TRANSACTION_ID|END_TO_END_TRANSACTION_ID|RESPONSE_CODE|RESPONSE_MESSAGE|SOURCE_COUNTRY_CODE|PAYMENT_COUNTRY_CODE|PAYMENT_CURRENCY_CODE|TOTAL_PAYMENT_AMOUNT|SENDER_NAME|RECEIVER_NAME|SENDER_AGENT_SPID|RECEIVER_AGENT_SPID|SENDER_ACCOUNT|RECEIVER_ACCOUNT|REPORTING_CODE|RECEIVER_MESSAGE|CREATED_DATE|MIS_DATE|SENDER_SUSPENSE_ACCOUNT_FLAG|RECEIVER_SUSPENSE_ACCOUNT_FLAG|KNOWN_FRAUD_FLAG|FROM_FILENAME|MODIFIED_DATE|CREATED_BY|MODIFIED_BY|FILE_ID
```

| No. | Fields |
| ------ | -------|
| 1|PROCESSING_DATE_TIME|
| 2|PROCESSING_WINDOW|
| 3|MESSAGE_ID|
| 4|TRANSACTION_TYPE|
| 5|TCIBTXID|
| 6|TRANSACTION_ID|
| 7|END_TO_END_TRANSACTION_ID|
| 8|RESPONSE_CODE|RESPONSE_MESSAGE|
| 9|SOURCE_COUNTRY_CODE|
| 10|PAYMENT_COUNTRY_CODE|
| 11|PAYMENT_CURRENCY_CODE|
| 12|TOTAL_PAYMENT_AMOUNT|
| 13|SENDER_NAME|
| 14|RECEIVER_NAME|
| 15|SENDER_AGENT_SPID|
| 16|RECEIVER_AGENT_SPID|
| 17|SENDER_ACCOUNT|
| 18|RECEIVER_ACCOUNT|
| 19|REPORTING_CODE|
| 20|RECEIVER_MESSAGE|
| 21|CREATED_DATE|
| 22|MIS_DATE|
| 23|SENDER_SUSPENSE_ACCOUNT_FLAG|
| 24|RECEIVER_SUSPENSE_ACCOUNT_FLAG|
| 25|KNOWN_FRAUD_FLAG|
| 26|FROM_FILENAME|
| 27|MODIFIED_DATE|
| 28|CREATED_BY|
| 29|MODIFIED_BY|
| 30|FILE_ID


## 6. Conclusion

Congratulations! You have successfully set up and configured the Batch PPA application to handle the sending of preparation messages and resending missing PACS002 messages. For further assistance, refer to the documentation or contact our support team.