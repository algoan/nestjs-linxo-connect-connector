<p align="center">
  <a href="http://algoan.com/" target="blank"><img src="./public/algoan_linxo_connect.png" width="500" alt="Algoan Logo" /></a>
</p>

[![Run Build and tests](https://github.com/algoan/nestjs-linxo-connect-connector/actions/workflows/test.yaml/badge.svg)](https://github.com/algoan/nestjs-linxo-connect-connector/actions/workflows/test.yaml)

# Algoan NestJS Linxo Connect connector

A simple connector using [NestJS](https://nestjs.com/) framework to connect your service to [Linxo Connect](https://linxoconnect.com/).

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository for Algoan connectors.

## About Algoan and Linxo Connect

- [Algoan](https://www.algoan.com) helps companies to build the best open banking experience for credits. To see our products, please refer to our official website
- [Linxo Connect](https://developers.oxlin.io) is a french banking data aggregator for financial services.

## Goal and philosophy

A connector is a web software able to connect a provider to Algoan's API. It subscribes to REST Hooks which lets Algoan notifying the connector when a specific event happens.

The **`nestjs-linxo-connect-connector`** focuses on a user bank accounts and transactions. The main goal of this connector is to be able to retrieve a user bank data when Algoan wishes to.

## Listened subscriptions

This section describes the process required for each subscription for an aggregator connector.

### Aggregator Link Required

When the user is about to connect their bank accounts, the connector is triggered in order to supply the [Linxo Connect widget](https://developers.oxlin.io/docs/accounts-api-quickstart).

> 💡 For now, we only support the Linxo Connect widget as [an iframe](https://developers.oxlin.io/docs/accounts-api-howto-iframe). If you want to redirect the end-user instead of embedding Linxo, please contact [us](mailto://support@algoan.com)

* The client should have this configuration data in the service account:
  
```typescript
  {
    "clientId": string;
    "clientSecret": string;
    "connectionUrl": string;
  }
```

* And the event should contains the customerId:

```typescript
  {
    customerId: string;
  }
```

The diagram below describes interactions:


```mermaid
sequenceDiagram
    participant EU as End user
    participant Algoan
    participant LCC as Linxo Connect Connector
    participant LC as Linxo Connect
    EU ->> Algoan: Begins bank connection
    Algoan ->> LCC: trigger aggregator_link_required event
    LCC ->> Algoan: GET /v2/customers/{id}
    LCC ->> LC: Client authentication
    LCC ->> LC: Get or create a user
    LCC ->> LC: User authentication
    LCC ->> LC: Create a widget session
    LCC ->> Algoan: Send the widget URL
    Algoan ->> EU: Display Linxo Connect widget
```


### Bank Details Required

When the user has finished the aggregation process, the connector has to retrieve user's banks accounts and transactions.

* The event should contains those information:

```ts
  {
    customerId: string;
    analysisId: string; // The analysis id to update with account and transaction data
  }
```

The diagram below describes interactions:

```mermaid
sequenceDiagram
    participant EU as End user
    participant Algoan
    participant LCC as Linxo Connect Connector
    participant LC as Linxo Connect
    EU ->> Algoan: End of the bank connection
    Algoan ->> LCC: trigger bank_details_required event
    LCC ->> Algoan: GET /v2/customers/{id}
    LCC ->> LC: Authenticate the user
    LCC ->> LC: Get connections
    LCC ->> LC: Get accounts
    LCC ->> LC: Get transactions
    LCC ->> Algoan: PATCH /v2/customers/{id}/analyses/{analysisId}            
```

Refers to the [`bank_details_required`](https://developers.algoan.com/public/docs/algoan_documentation/resthooks_and_events/event_list.html#bank_details_required) event.

## Application Structure

- `config/`: stores all configurations for the application. It uses [node-config-ts](https://github.com/tusharmath/node-config-ts) to generate a type definition of the `default.json` file.
- `src/config/`: Simple NestJs module to inject configuration in services
- `src/algoan/`: Algoan module getting your service accounts. It uses the [@algoan/rest](https://github.com/algoan/rest-nodejs) library.
- `src/linxo-connect/`: Linxo Connect module to manage Linxo Connect API.
- `src/hooks/`: Entry point for your [RestHook](https://developers.algoan.com/public/docs/algoan_documentation/resthooks_and_events/resthooks.html) called by Algoan. It handles [events](https://developers.algoan.com/public/docs/algoan_documentation/resthooks_and_events/event_list.html) you've subscribed to.
- `test/`: contains e2e tests.

## Contributing

We would love to have your contribution, thank you for that! 🎉

If you want to add missing APIs, or correct an issue, you will have to follow this list of instructions.

### Instructions

- Set up your local environment by forking the repository.
- When you are about to commit, [commitlint](https://github.com/conventional-changelog/commitlint) is running to check if your commit message respects [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/).
- Write tests, there is a high coverage on the repository. Simply run `npm run test:cov` to generate a `coverage/` directory.
- Respect [coding style](#code-style). Run `npm run lint` to check if there are errors.
- Open a Pull Request where you describe the feature/issue you are about to publish.

### Code Style

This project uses [ESLint](https://eslint.org/) to analyze the TypeScript code. Commit are linted too thanks to [commitlint](https://github.com/conventional-changelog/commitlint) and the [conventional commit format](https://conventionalcommits.org/).

## Usage

How to use locally the connector

### Requirements

This connector is a [Node.js](https://nodejs.org/en/) application. Before reading further, you need to [download and install Node.js](https://nodejs.org/en/download/).
### Installation

Clone the repository:

```bash
$ git clone https://github.com/algoan/nestjs-linxo-connect-connector.git
```

Install all dependencies running:

```bash
$ npm install
```

### How to test locally

To test locally the Linxo Connect Link process, a simple `index.html` file is rendered. To use it:

Before testing:

- The client config should be updated in `service-accounts.config` in  `./json-server/db.json'.
- You can enable http log `config/default.json` with `enableHttpRequestLog`, `enableHttpResponseLog`, `enableHttpErrorLog`

Run Test:

- Run `npm run start:dev`. It will render an index.html file. Algoan APIs are exposed and mocked by a [json-server](https://github.com/typicode/json-server).
- Go to your favorite browser and navigate to http://localhost:4000. It should display a web page:

![index_page](public/index-page.png)

- With the two provided buttons, you are able to test the two available Linxo Connect processes:
  - Embedded: Click on the button "Open embedded Linxo Connect Link". It will call a `GET /iframe` API which simulates a webhook call to your connector, tries to fetch an iframe URL and display an iframe with this URL. At the end of the Linxo Connect Link process, a `GET /callback?code=...` will be called. It will simulated the `bank_reader_details` webhook event to the connector. Moreover, the iframe is remove from the interface.

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

If you need credentials for your service, please contact [support@algoan.com](mailto://support@algoan.com).
