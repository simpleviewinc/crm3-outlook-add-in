const { deepCheck } = require('@simpleview/assertlib');
const mochaLib = require('@simpleview/mochalib');
const assert = require('assert');
const {
	isValidDate,
	errorHandler,
	routeErrorHandler,
} = require('../utilities');

describe(__filename, () => {
	describe('Validate - errorHandler', () => {
		// https://stackoverflow.com/questions/45784314/how-to-trigger-express-error-middleware

		let req;
		let res;
		const next = () => {}

		beforeEach(() => {
			req = {
				params: {},
				body: {},
			}

			res = {
				status(status) {
					this.status = status;

					return this;
				},
				json(response){
					this.response = response;

					return response;
				},
			}
		});

		const tests = [
			{
				name: 'Test Pass - error is caught with no `status` code, defaults to 500',
				args: {
					query: () => {
						errorHandler(new Error('Test Error!'), req, res, next);

						return res;
					},
					result: {
						status: 500,
						response: {
							success: false,
							message: 'Test Error!',
						}
					},
				}
			},
			{
				name: 'Test Pass - error is caught with defined `status` code',
				args: {
					query: () => {
						const err = new Error('400 Test Error!');
						err.status = 400;

						errorHandler(err, req, res, next);

						return res;
					},
					result: {
						status: 400,
						response: {
							success: false,
							message: '400 Test Error!',
						}
					},
				}
			},
			{
				name: 'Test Pass - error is caught with defined `statusCode` code',
				args: {
					query: () => {
						const err = new Error('402 Test Error!');
						err.statusCode = 402;

						errorHandler(err, req, res, next);

						return res;
					},
					result: {
						status: 402,
						response: {
							success: false,
							message: '402 Test Error!',
						}
					},
				}
			},
			{
				name: 'Test Pass - error is caught with no `message`',
				args: {
					query: () => {
						const err = new Error();

						errorHandler(err, req, res, next);

						return res;
					},
					result: {
						status: 500,
						response: {
							success: false,
							message: '',
						}
					},
				}
			},
		];

		mochaLib.testArray(tests, async (test) => {
			let result;

			try {
				result = await test.query();
			} catch (error) {
				assert.strictEqual(error.message, test.error);
				return;
			}

			assert.ok(!test.error, 'Something unexpected happened. An error was expected, but none was thrown.');

			deepCheck(result, test.result);
		});
	});

	describe('Validate - routeErrorHandler', () => {
		// https://stackoverflow.com/questions/45784314/how-to-trigger-express-error-middleware

		let err;
		let req;
		let res;

		// In the `routeErrorHandler` function, next() should only be
		// called when an error is thrown. If an error is thrown,
		// set the `err` object.
		const next = () => {
			err = new Error('An error was thrown!');
		}

		beforeEach(() => {
			err = {
				message: 'No errors were thrown!'
			}

			req = {
				params: {},
				body: {}
			}

			res = {}
		});

		const tests = [
			{
				name: 'Test Pass - no error was thrown inside `routeErrorHandler`',
				args: {
					query: async () => {
						const fn = routeErrorHandler(async (req, res, next) => {
							return;
						});

						await fn(req, res, next);

						return err.message;
					},
					result: 'No errors were thrown!',
				}
			},
			{
				name: 'Test Pass - an error was thrown inside `routeErrorHandler`',
				args: {
					query: async () => {
						const fn = routeErrorHandler(async (req, res, next) => {
							throw new Error('Something broke!');
						});

						await fn(req, res, next);

						return err.message;
					},
					result: 'An error was thrown!',
				}
			},
		];

		mochaLib.testArray(tests, async (test) => {
			let result;

			try {
				result = await test.query();
			} catch (error) {
				assert.strictEqual(error.message, test.error);
				return;
			}

			assert.ok(!test.error, 'Something unexpected happened. An error was expected, but none was thrown.');

			deepCheck(result, test.result);
		});
	});
});