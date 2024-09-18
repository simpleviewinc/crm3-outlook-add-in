const { execSync } = require('child_process');

describe(__filename, function() {
	this.timeout(15000);

	it('Validate Code Styles - ESLint should not have any errors', () => {
		execSync('yarn style', { stdio: 'inherit' });
	});
});