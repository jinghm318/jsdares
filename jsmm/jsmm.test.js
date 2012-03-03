module.exports = function(jsmm) {
	require('./jsmm.browser')(jsmm);
	require('./jsmm.msg')(jsmm);
	
	jsmm.test = {};
	
	jsmm.test.Console = function() {
		this.result = '';
	};
	
	jsmm.test.Console.prototype.log = function(str) {
		this.result += str + '\n';
	};
	
	jsmm.test.runAll = function() {
		jsmm.test.output = '';
		failed = 0;
		for (var name in jsmm.test.tests.succeed) {
			if (!jsmm.test.runTest(name.replace(/_/g, ' '), jsmm.test.tests.succeed[name], true)) failed++;
		}
		for (var name in jsmm.test.tests.fail) {
			if (!jsmm.test.runTest(name.replace(/_/g, ' '), jsmm.test.tests.fail[name], false)) failed++;
		}
		if (failed <= 0) {
			jsmm.test.output += 'All tests completed successfully!';
		} else if (failed == 1) {
			jsmm.test.output += 'Unfortunately 1 test failed...';
		} else {
			jsmm.test.output += 'Unfortunately ' + failed + ' tests failed...';
		}
		return jsmm.test.output;
	};
	
	jsmm.test.printError = function(name, name1, name2, error1, error2, code) {
		jsmm.test.output += 'In test "' + name + '" ' + name1 + ' and ' + name2 + ' were incorrect.\n';
		jsmm.test.output += name1 + ':\n' + error1 + '\n';
		jsmm.test.output += name2 + ':\n' + error2 + '\n';
		jsmm.test.output += 'code:\n' + code + '\n';
	};
	
	jsmm.test.runTest = function(name, code, succeed) {
		var consoleRaw = new jsmm.test.Console();
		var consoleSafe = new jsmm.test.Console();
		var consoleStep = new jsmm.test.Console();
		var errorRaw = null;
		var errorSafe = null;
		var errorStep = null;
		var browser = new jsmm.Browser(code);
		
		if (succeed) {
			browser.setScope({console: consoleRaw});
			if (!browser.runRaw()) {
				errorRaw = browser.getError();
			}
		}
		
		browser.setScope({console: consoleSafe});
		if (!browser.runSafe()) {
			errorSafe = browser.getError();
		}
		
		browser.setScope({console: consoleStep});
		if (!browser.runStep()) {
			errorStep = browser.getError();
		}
		
		// when it should succeed we can compare against the raw result
		if (succeed && !jsmm.test.compareErrors(errorRaw, errorSafe)) {
			jsmm.test.printError(name, 'errorRaw', 'errorSafe', errorRaw, errorSafe, code);
			return false;
		}
		
		if (!jsmm.test.compareErrors(errorSafe, errorStep)) {
			jsmm.test.printError(name, 'errorSafe', 'errorStep', errorSafe, errorStep, code);
			return false;
		}
		
		if (succeed && consoleRaw.result !== consoleSafe.result) {
			jsmm.test.printError(name, 'consoleRaw', 'consoleSafe', consoleRaw.result, consoleSafe.result, code);
			return false;
		}
		
		if (consoleSafe.result !== consoleStep.result) {
			jsmm.test.printError(name, 'consoleSafe', 'consoleStep', consoleSafe.result, consoleStep.result, code);
			return false;
		}
		
		jsmm.test.output += 'Test "' + name + '" completed successfully!\n';
		return true;
	};
	
	jsmm.test.compareErrors = function(error1, error2) {
		if (error1 === null && error2 === null) {
			return true;
		} else if (error1 === null || error2 === null) {
			return false;
		} else if (error1.orig !== null || error2.orig !== null) {
			return false;
		} else {
			return error1.html === error2.html;
		}
	};
	
	jsmm.test.tests = { succeed: {}, fail: {}};
	
	jsmm.test.tests.succeed.comments =
	'  // one line comment' + '\n' +
	'  /* multiline' + '\n' +
	'comment with * and / and /* and /***...' + '\n' +
	'and also // and ///*** and more! */' + '\n' +
	'console.log("Hello world!");';
	
	jsmm.test.tests.succeed.assignments =
	'// variable assignments' + '\n' +
	'var a;' + '\n' +
	'a = 0;' + '\n' +
	'console.log(a);' + '\n' +
	'var a = 5;' + '\n' +
	'console.log(a);' + '\n' +
	'var b = a*a+a/a-a%a+(a*a*a-a);' + '\n' +
	'console.log(b);' + '\n' +
	'var c=b, d=c, e=d;' + '\n' +
	'console.log(e);' + '\n' +
	'c = b==c && c==d && d==b;' + '\n' +
	'console.log(c);' + '\n' +
	'd = c || b > d;' + '\n' +
	'console.log(d);' + '\n' +
	'e = (1>2 && 1>=2 && 2<1 && 2<=1) || 2 != 1;' + '\n' +
	'console.log(e);' + '\n' +
	'var f = -5 > +3 || !false;' + '\n' +
	'console.log(f);' + '\n' +
	'f = !(f || false) || false;' + '\n' +
	'console.log(f);' + '\n' +
	'a = 1.4E-02;' + '\n' +
	'console.log(a);' + '\n' +
	'a += a;' + '\n' +
	'console.log(a);' + '\n' +
	'a *= a;' + '\n' +
	'console.log(a);' + '\n' +
	'a -= a/10;' + '\n' +
	'console.log(a);' + '\n' +
	'a /= 0.003;' + '\n' +
	'console.log(a);' + '\n' +
	'a %= 10;' + '\n' +
	'console.log(a);' + '\n' +
	'a++;' + '\n' +
	'console.log(a);' + '\n' +
	'a--;' + '\n' +
	'console.log(a);' + '\n' +
	'a = 5+3*5+1+9*10/5%2+18/23-52/16%82-53*32;' + '\n' +
	'console.log(a);' + '\n' +
	'var str="";' + '\n' +
	'console.log(str);' + '\n' +
	'str += "hi";' + '\n' +
	'console.log(str);' + '\n' +
	'str += 10;' + '\n' +
	'console.log(str);' + '\n' +
	'str = 5+5+str;' + '\n' +
	'console.log(str);' + '\n' +
	'var len = str.length;' + '\n' +
	'console.log(len);';
	
	jsmm.test.tests.succeed.control =
	'// control structures' + '\n' +
	'var f=true, e=!f;' + '\n' +
	'if (true) {' + '\n' +
	'  console.log(true);' + '\n' +
	'  if (f && e && false) {' + '\n' +
	'    console.log(false);' + '\n' +
	'  } else {' + '\n' +
	'    if (false) {' + '\n' +
	'      console.log(false);' + '\n' +
	'    } else if (true) {' + '\n' +
	'      console.log(true);' + '\n' +
	'    }' + '\n' +
	'  }' + '\n' +
	'}' + '\n' +
	'' + '\n' +
	'var i=0;' + '\n' +
	'while (i<10) {' + '\n' +
	'  console.log(i*i-i);' + '\n' +
	'  i++;' + '\n' +
	'}' + '\n' +
	'' + '\n' +
	'for (var j=0; j<10; j++) {' + '\n' +
	'  console.log(j);' + '\n' +
	'}';
	
	jsmm.test.tests.succeed.functions_simple =
	'// functions simple' + '\n' +
	'function f1(n) {' + '\n' +
	'  console.log(n*100);' + '\n' +
	'}' + '\n' +
	'function f2(n) {' + '\n' +
	'  return n*100;' + '\n' +
	'}' + '\n' +
	'f1(10);' + '\n' +
	'console.log(f2(20));';
	
	jsmm.test.tests.succeed.functions_complex =
	'// functions complex' + '\n' +
	'var a, b=100, c="test", d=1000;' + '\n' +
	'function f1(a, b, c, q1, q2, q3) {' + '\n' +
	'  console.log(a+d);' + '\n' +
	'  console.log(f2(b*3)/3);' + '\n' +
	'  console.log(f3(b, c));' + '\n' +
	'  console.log((q1+q2)%q3);' + '\n' +
	'}' + '\n' +
	'function f2(n) {' + '\n' +
	'  var c = n;' + '\n' +
	'  return n+(3/c);' + '\n' +
	'}' + '\n' +
	'function f3(a,b) {' + '\n' +
	'  console.log(a);' + '\n' +
	'  console.log(b);' + '\n' +
	'  for (var c=0; c>-100; c--) {' + '\n' +
	'    a *= b;' + '\n' +
	'  }' + '\n' +
	'  return a+b;' + '\n' +
	'}' + '\n' +
	'var x=5, y=10, z=15;' + '\n' +
	'f1(x,y,z, 8, 9, 10, "test");';
	
	jsmm.test.tests.succeed.missing_semicolon_1 = 'var a';
	jsmm.test.tests.succeed.missing_semicolon_2 = 'var a=5*5';
	jsmm.test.tests.succeed.missing_semicolon_3 = 'var a;\n a=5*5';
	jsmm.test.tests.succeed.missing_semicolon_4 = 'var a;\n if (a) {\n a=5*5 \n}';
	jsmm.test.tests.succeed.missing_semicolon_5 = 'console.log(5)';
	jsmm.test.tests.succeed.missing_semicolon_6 = 'var a;\n a+=a';
	jsmm.test.tests.succeed.missing_semicolon_7 = 'for(var a=0 a<5; a++) {\n }';
	jsmm.test.tests.succeed.missing_bracket_1 = 'if (true) \n }';
	jsmm.test.tests.succeed.missing_bracket_2 = 'if (true) {';
	jsmm.test.tests.succeed.missing_bracket_3 = 'while (true) \n }';
	jsmm.test.tests.succeed.missing_bracket_4 = 'while (true) {';
	jsmm.test.tests.succeed.missing_bracket_5 = 'for (var i=0; i<10; i++) \n }';
	jsmm.test.tests.succeed.missing_bracket_6 = 'for (var i=0; i<10; i++) {\n';
	jsmm.test.tests.succeed.missing_bracket_7 = 'if (true) {\n } else \n }';
	jsmm.test.tests.succeed.missing_bracket_8 = 'if (true) {\n } else { \n';
	jsmm.test.tests.succeed.missing_bracket_9 = 'if (true) {\n  else { \n }';
	jsmm.test.tests.succeed.missing_bracket_10 = 'if (true) \n } else { \n }';
	jsmm.test.tests.succeed.missing_bracket_11 = 'if (5>(5+5) {\n }';
	jsmm.test.tests.succeed.missing_bracket_12 = 'if 5>5) {\n }';
	jsmm.test.tests.succeed.incorrect_string_1 = 'var str = "Hello World!;';
	jsmm.test.tests.succeed.incorrect_string_2 = 'var str = "Hello World!';
	jsmm.test.tests.succeed.incorrect_string_3 = 'var str = Hello World!";';
	jsmm.test.tests.succeed.reserved_word_1 = 'var jsmm;';
	jsmm.test.tests.succeed.reserved_word_2 = 'var vars;';
	
	jsmm.test.tests.fail.unary_1 = 'console.log(+true);';
	jsmm.test.tests.fail.unary_2 = 'console.log(-false);';
	jsmm.test.tests.fail.unary_3 = 'console.log(+"string");';
	jsmm.test.tests.fail.unary_4 = 'console.log(-"string");';
	jsmm.test.tests.fail.unary_5 = 'console.log(!"string");';
	jsmm.test.tests.fail.unary_6 = 'console.log(!5);';
	jsmm.test.tests.fail.invalid_funcion_call_1 = 'function f(a, b) {\n return a;\n }\n f(1);';
	jsmm.test.tests.fail.invalid_funcion_call_2 = 'function f(a, b) {\n return a+b;\n }\n f(1);';
};