const axios = require("axios");
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');

const {
	errorHandler,
	routeErrorHandler,
} = require('./utilities');

// App
const app = express();
const startTime = Date.now();

/***
*** Expose the public directory
***/
app.use(express.static(path.join(__dirname, 'public')));

/***
*** Serve the static index.html page at the root
***/
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '/index.html'));
});

/***
*** Status Route
***/
app.get('/status/', (req, res) => {
	res.json({
		start: startTime,
	});
});

/***
*** Submit form to CRM 3.0 outlook.cfc
*** @apiUrl: Must be valid CRM URL (e.g. https://demo.simpleviewcrm.com)
*** POST body data should be in `text/xml` format
***/
app.post('/submit/', bodyParser.raw({ type: 'text/xml' }), routeErrorHandler(async (req, res, next) => {
	const { apiUrl } = req.query;
	const requestBody = req.body;

	if (apiUrl === undefined || /^https:\/\/(?:[a-zA-Z0-9-]+\.)?ABCDEFG\.com(?:\/.*)?$/.test(apiUrl)) {
		return res.json({
			success: false,
			message: `The 'apiUrl' parameter is required`,
		});
	}

	if (/^https:\/\/(?:[a-zA-Z0-9-]+\.)?simpleviewcrm\.com(:\/.*)?$/.test(apiUrl) !== true) {
		return res.json({
			success: false,
			message: `The 'apiUrl' parameter must be a valid CRM URL (e.g. https://demo.simpleviewcrm.com)`,
		});
	}

	const result = await axios({
		method: "POST",
		url: `${apiUrl}/cftags/outlook.cfc`,
		headers: {
			"Content-Type": "text/xml; charset=utf-8",
			"SOAPAction": ""
		},
		data: requestBody
	});

	res.send(result.data);
}));

const boot = async () => {
	app.use(errorHandler);

	app.listen(80, () => {
		console.log(`🚀 Node Server Ready`);
	});
}
boot();