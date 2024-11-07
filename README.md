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
  - [4.1 Expected File Fields](#41-expected-file-fields)
  - [5. Conclusion](#5-conclusion)

## Introduction

Welcome to the Batch PPA Node.js application documentation. This application enables batch sending of various payment messages to the FRMS system, including preparation messages like PAIN001, PACS008, and PAIN013. Additionally, the application supports resending missing PACS002 messages, comparing reports, and managing the messages.

## 1. Installation

To install the Batch PPA application, follow these steps:

1. Clone the repository: ```git clone https://github.com/frmscoe/batch-ppa.git```
2. Navigate to the application folder: ```cd batch-ppa```
3. Install dependencies: ```npm install```

## 2. Configuration

Before using the application, configure it by editing the `.env.template` file. This file contains essential settings, such as environment variables for required services like Arango, APM, and others. After editing, rename the file to `.env`.

[batch-ppa/.env.template at main · frmscoe/batch-ppa (github.com)](https://github.com/frmscoe/batch-ppa/blob/main/.env.template)

## 3. Sending Batch Messages

### Step 1: /v1/uploadfile

To initiate batch execution, upload the source file containing transaction records to the server-side host. The file should be delimited by ‘|’ and include the transaction fields specified in section 4.1.

For uploading, use a tool like Postman, which supports requests with form-data in the body and allows file attachments. Ensure that the file does not exceed 100 MB, which typically accommodates 100,000 transactions by default. This limit can be adjusted by setting the `MAX_FILE_SIZE` in your environment variables.

Configuration steps:
1. Set the endpoint to `{yourhost}/v1/uploadfile` and use the HTTP method `POST`.
2. Attach the file using the key name "batch."
3. Send the request and wait for the batch process to complete before moving to Step 2.

### Step 2: /v1/executebatch

Batch PPA executes the batch in two stages. The first stage sends preparation messages, including PAIN001, PAIN013, and PACS008. The second stage sends PACS002 messages to generate FRMS reports.

Example:

## 3.1 Sending Preparation Messages

The Batch PPA application can send a batch of preparation messages. Use a request tool like Postman and configure the request as follows:

- Set the method to `POST` and point the address to `{yourhost}/v1/executebatch`.
- In the body, set `"pacs002": false` to initiate basic preparation.

The application will iterate through the list of preparation messages and send them to the Arango database.

## 3.2 Sending PACS002 Messages

Sending PACS002 messages requires a fully operational FRMS system, as this step generates the report. To trigger the sending of PACS002, set `"pacs002": true` in the request body. This will propagate data for reports and PACS002 messages in the database, allowing you to retrieve batch reports.

## 3.3 Resending PACS002 Messages

To retry missed transactions, set `"pacs002.overwrite": true` in the request body. The service will attempt resending based on the `RETRY` variable specified in the configuration. After retrying, there may still be missed transactions, which will require resending the execute request with the same options enabled.

Retries will occur only if the number of transactions in the final report does not match the original source file count. Changing the source file may affect the missed transaction count evaluation.

## 4. Error Handling

The application includes error-handling mechanisms to capture and report errors during message sending and conversion. Be sure to review error logs for troubleshooting.

## 4.1 Expected File Fields

The file should contain the following fields, delimited by `|`:

```
PROCESSING_DATE_TIME|PROCESSING_WINDOW|MESSAGE_ID|TRANSACTION_TYPE|TCIBTXID|TRANSACTION_ID|END_TO_END_TRANSACTION_ID|RESPONSE_CODE|RESPONSE_MESSAGE|SOURCE_COUNTRY_CODE|PAYMENT_COUNTRY_CODE|PAYMENT_CURRENCY_CODE|TOTAL_PAYMENT_AMOUNT|SENDER_NAME|RECEIVER_NAME|SENDER_AGENT_SPID|RECEIVER_AGENT_SPID|SENDER_ACCOUNT|RECEIVER_ACCOUNT|REPORTING_CODE|RECEIVER_MESSAGE|CREATED_DATE|MIS_DATE|SENDER_SUSPENSE_ACCOUNT_FLAG|RECEIVER_SUSPENSE_ACCOUNT_FLAG|KNOWN_FRAUD_FLAG|FROM_FILENAME|MODIFIED_DATE|CREATED_BY|MODIFIED_BY|FILE_ID
```

## 5. Conclusion

Congratulations! You have successfully set up and configured the Batch PPA application to handle the sending of preparation messages and resending missing PACS002 messages. For further assistance, refer to the documentation or contact our support team.

---

Let me know if you'd like further refinement!