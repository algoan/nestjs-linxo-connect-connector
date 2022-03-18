/* eslint-disable no-console */
/* eslint-disable no-magic-numbers */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
const db = require('./db.json');
const axios = require('axios');
const crypto = require('crypto');
const delay = require('delay');
const config = require('node-config-ts').config;
const path = require('path');
const jsonServer = require('json-server');

const defaultDelay = 500;
const server = jsonServer.create();
const router = jsonServer.router(db);
const middlewares = jsonServer.defaults();
// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.post('/v1/oauth/token', (req, res) => {
  res.json({
    access_token: 'access_token_jwt',
    expires_in: 60,
    refresh_expires_in: 864000,
    refresh_token: 'refresh_token',
    token_type: 'bearer',
    'not-before-policy': 1566571512,
    session_state: 'xxxxx-xxxxx-xxxxx',
    scope: 'profile email',
  });
});

const sendFakeWebhookRequest = (subscription, payload) => axios.post(
  `http://localhost:${config.port}/hooks`,
  {
    subscription: {
      eventName: subscription.eventName,
      id: subscription.id,
      status: subscription.status,
      target: subscription.target,
    },
    payload,
    time: Date.now(),
    id: 'random_id',
    index: Math.floor(Math.random() * 100),
  },
  {
    headers: {
      'x-hub-signature': `sha256=${crypto.createHmac('sha256', subscription.secret).update(JSON.stringify(payload)).digest('hex')}`,
    },
  },
);

/**
 * Provide the Oxlin Widget Session link for the iframe mode
 */
server.get('/iframe', async (req, res) => {
  // Reset Data
  // Set a new customer id at each test to avoid duplicate user error on oxlin
  db.customers[0].id = `random-${Date.now()}`;
  db.analyses[0].accounts = undefined;

  // Prepare payload
  const customerId = db.customers[0].id;
  const payload = {
    customerId,
  };
  const subscription = db.subscriptions[0];

  await sendFakeWebhookRequest(subscription, payload);

  /**
   * Try to get the iframeUrl property
   */
  const retryCount = 120;
  let count = 0;
  let iframeUrl;

  do {
    await delay(defaultDelay);
    iframeUrl = db.customers[0].aggregationDetails.iframeUrl;
    count++;
  } while (iframeUrl === undefined && count < retryCount);

  if (iframeUrl === undefined) {
    res.status(404).send({
      message: 'Iframe url not found',
    });
  }

  res.send(iframeUrl);
});

/**
 * Route called at the end of the process
 */
server.get('/callback', async (req, res) => {
  const tempCode = req.query.code;
  const subscription = db.subscriptions[1];
  const payload = {
    customerId: db.customers[0].id,
    analysisId: db.analyses[0].id,
    temporaryCode: tempCode,
  }
  // Simulate a webhook call
  await axios.post(
    `http://localhost:${config.port}/hooks`,
    {
      subscription: {
        eventName: subscription.eventName,
        id: subscription.id,
        status: subscription.status,
        target: subscription.target,
      },
      payload,
      time: Date.now(),
      id: 'random_id',
      index: Math.floor(Math.random() * 100),
    },
    {
      headers: {
        'x-hub-signature': `sha256=${crypto.createHmac('sha256', subscription.secret).update(JSON.stringify(payload)).digest('hex')}`,
      },
    },
  );

  res.sendFile(path.join(__dirname, '..', 'public/index.html'));
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);

// Use default router
server.use(
  jsonServer.rewriter({
    '/v1/*': '/$1',
    '/v2/*': '/$1',
    '/customers/:customerId/:resource/*': '/:resource/$3',
    '/subscriptions/:subscriptionId/:resource/*': '/:resource/$3',
  }),
);

server.use(router);

server.listen(4000, () => {
  console.log('JSON Server is running');
});
