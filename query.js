const Doc = require('./client');
const client = new Doc();
let err;


const prompts = require('prompts');
let exit = false;

function validateIndex(input) {
	if (!new RegExp('^[0-9]*$').test(input[1])) {
		return `index error doc-id is not an integer`;
	}
	if (!new RegExp('^[a-zA-Z0-9 ]+$').test(input.join(' '))) {
		return `index error A token contains a non-alphanumeric character`;
	}
	return true;

}

function validateQuery(input) {
	let query = input.join(' ');
	if (!new RegExp('^[a-zA-Z0-9 |&\(\)]+$').test(query)) {
		return `query error contains an invalid character`;
	}

	if( (query.match(new RegExp(/\&/g)) || []).length > 2 || 
		((query.match(new RegExp(/\&/g)) || []).length > 1 && (query.match(new RegExp(/\(/g)) || []).length === 0)) return `query error invalid syntax`;

	if( (query.match(new RegExp(/\|/g)) || []).length > 2 || 
		((query.match(new RegExp(/\|/g)) || []).length > 1 && (query.match(new RegExp(/\(/g)) || []).length === 0)) return `query error invalid syntax`;

	if( (query.match(new RegExp(/\(/g)) || []).length > 1 || (query.match(new RegExp(/\)/g)) || []).length > 1 ||
		((query.match(new RegExp(/\(/g)) || []).length === 1 && (query.match(new RegExp(/\)/g)) || []).length === 0)) return `query error invalid syntax`;	

	if( (query.match(new RegExp(/\(/g)) || []).length === 1 && (query.match(new RegExp(/\)/g)) || []).length === 1 &&
		query.indexOf('(') > query.indexOf(')')) return `query error invalid syntax`;	
	
	return true;
}

function validate(command) {
	
	const input = command.split(' ');
	if (input [0] === 'index' )  return validateIndex(input);
	if (input [0] === 'query')  return validateQuery(input);
	if (command === 'exit')  return true;
	return `invalid command`;
}

(async () => {
	while (!exit) {
		const response = await prompts({
		    type: 'text',
		    name: 'command',
		    message: 'Enter your command, enter `exit` to close',
		    validate: command => validate(command)
	  	});

		if (response.command === 'exit') {
	  		client.destroy();
	  		exit = true;
	  		return;
	  	}
	  	let command = response.command.split(' ');
	  	
	  	let type = command.shift();
	  	
	  	if (type === 'index') {
		  	let _id = command.shift();
            try {
            	const result = await client.create(_id, command);
            	console.log(`index ok ${result._id}`);
            }
            catch (error) {
            	console.log(`query error ${error.message}`);
            }
	  	}
	  	if (type === 'query'){
	  		let query = command.join('');
	  		try {
	        	const result = await client.search(query);
	        	let resultStr = result.hits.hits.map(el => el._id).join(' ');
	        	console.log(`query results ${resultStr}`);
	        }
	        catch (error) {
	        	console.log(`query error ${error.message}`);
	        }
	  		
	  	}

	}
})();