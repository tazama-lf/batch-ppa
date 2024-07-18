<!-- SPDX-License-Identifier: Apache-2.0 -->

# Batch PPA Documentation

- [Batch PPA Documentation](#batch-ppa-documentation)
  - [Introduction](#introduction)
  - [1. Installation](#1-installation)
  - [2. Configuration](#2-configuration)
  - [3. Sending Batch Messages](#3-sending-batch-messages)
    - [Step 1 /v1/uploadfile](#step-1-uploadfile)
    - [Step 2 /v1/execute](#step-2-execute)
  - [3.1 Sending Preparation messages](#31-sending-preparation-messages)
  - [3.2. Sending PACS002 Messages](#32-sending-pacs002-messages)
  - [3.3 Resending of Pacs002 Messages](#33-resending-of-pacs002-messages)
  - [4. Error Handling](#4-error-handling)
  - [4.1. Fields expected in the file are as follows](#41-fields-expected-in-the-file-are-as-follows)
  - [5. Conclusion](#5-conclusion)

## Introduction

Welcome to the documentation for the Batch PPA Node.js application. This application is designed to facilitate the sending of various payment messages in a batch to the FRMS system, including preparation messages like PAIN001, PACS008, and PAIN013. Additionally, the application supports the resending of missing PACS002 messages, comparing reports and the messages themselves.

## 1. Installation

To install the Batch PAA application, follow these steps:

1.1. Clone the repository: ```git clone https://github.com/frmscoe/batch-ppa.git```

1.2. Navigate to the application folder: ```cd batch-ppa```.

1.3. Install dependencies: npm install.

## 2. Configuration

Before using the application, you need to configure it by editing the .env.template file. This file contains settings such as environment variables for tools or services needed by the service itself such as arango, apm, and more, after editing this file please rename the file to .env

[batch-ppa/.env.template at main · frmscoe/batch-ppa (github.com)](https://github.com/frmscoe/batch-ppa/blob/main/.env.template)

## 3. Sending Batch Messages

### Step 1 /v1/uploadfile

Sending source file with transitions into the server-side host, the file is expected to have a delimiter of ‘|’ and have different fields of transitions which are mentioned in 4.1 this will get the execution of the batch ready. Now let’s get to how you do it, with a request tool like Postman that can send requests and the body of form data, which can attach to file, the file is limited to 100 MB now which should be 100 000 transactions in the batch. Make sure that you are pointing to your endpoint {yourhost}/uploadfile with Method of POST, then attach the file with the “batch” key name and then send the batch wait until finishes for step 2.

Example:

### Step 2 /v1/execute

As mentioned before batch ppa executes the batch in two steps, The first step is the execution of preparation messages which are pain001, pain013, and pacs008, and then the last step is the sending of pacs002 which will generate the report of FRMS.

Example:

## 3.1 Sending Preparation messages

The Batch PPA application can send a batch of preparation messages. By using any request tool like Postman and set the body

Set the Method to POST and point the address to your host {yourhost}/execute

Setup the body “pacs002: false” inside the object of the body this should do your basic preparation, Press send.

The application will iterate through the list of preparation messages and send them to the Arango database.

## 3.2. Sending PACS002 Messages

Sending of Pac002 messages, triggering this request will require the fully ready FRMS system because the generation of report is expected on this step.

pacs002:true Request body, This should trigger the sending of pacs002 expected data propagation is reports and pacs002 on the database allowing you to get batch reports.

## 3.3 Resending of Pacs002 Messages

pacs002.overwrite: true With this setting set to true on the request body the service will retry the missed transactions in relation to the number that has been specified in config for the RETRY variable, note that after retry u might still have missed transactions that would require the resending of execute request with same options enabled.

The retry will only happen if in comparison to final reports not exactly the matching number of transactions from the source file. If you change the source file you might be risking the evaluation of the missed transactions

## 4. Error Handling

The application includes error-handling mechanisms to capture and report errors during message sending and conversion. Make sure to review error logs for troubleshooting.

## 4.1. Fields expected in the file are as follows

PROCESSING_DATE_TIME|PROCESSING_WINDOW|MESSAGE_ID|TRANSACTION_TYPE|TCIBTXID|TRANSACTION_ID|END_TO_END_TRANSACTION_ID|RESPONSE_CODE|RESPONSE_MESSAGE|SOURCE_COUNTRY_CODE|PAYMENT_COUNTRY_CODE|PAYMENT_CURRENCY_CODE|TOTAL_PAYMENT_AMOUNT|SENDER_NAME|RECEIVER_NAME|SENDER_AGENT_SPID|RECEIVER_AGENT_SPID|SENDER_ACCOUNT|RECEIVER_ACCOUNT|REPORTING_CODE|RECEIVER_MESSAGE|CREATED_DATE|MIS_DATE|SENDER_SUSPENSE_ACCOUNT_FLAG|RECEIVER_SUSPENSE_ACCOUNT_FLAG|KNOWN_FRAUD_FLAG|FROM_FILENAME|MODIFIED_DATE|CREATED_BY|MODIFIED_BY|FILE_ID

## 5. Conclusion

Congratulations! You have successfully set up and configured the Batch PPA application to handle the sending of preparation messages and resending missing PACS002 messages. For further assistance, refer to the documentation or contact our support team.
