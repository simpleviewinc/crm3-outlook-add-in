// Function for catching unhandled errors in routes
const routeErrorHandler = expressRouteFn => async (req, res, next) => {
	try {
		await expressRouteFn(req, res, next);
	} catch (error) {
		next(error);
	}
}

// Catch-All Error Handler
const errorHandler = (err, req, res, next) => {
	const statusCode = err.status || err.statusCode || 500;

	res.status(statusCode).json({
		success: false,
		message: err.message,
	});
}

module.exports = {
	routeErrorHandler,
	errorHandler
}