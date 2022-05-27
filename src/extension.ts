// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
	writeFile, 
} from 'fs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	vscode.window.showInformationMessage('Welcome to the future of testing!');
	
	// let disposableExtractTestFiles = vscode.commands.registerCommand('test-extractor.extractTestFiles', async () => {
	// 	vscode.window.showOpenDialog({
	// 		canSelectFiles: false,
	// 		canSelectFolders: true,
	// 		canSelectMany: false,
	// 		openLabel: 'Select folders or files',
	// 		filters: {
	// 			'testFiles': ['ts', 'js', 'tsx', 'jsx'],
	// 			'allFiles': ['*'],
	// 		},
	// 	}).then(async (folder) => {
	// 		if (folder) {
	// 			let folderPath = folder[0].fsPath;
	// 			vscode.window.showInformationMessage(`Extracting tests from ${folderPath}`);
	// 			let files = await vscode.workspace.findFiles(`**/*.{ts,js,tsx,jsx}`, '{**/node_modules/**,**/vscode/**,**/**/*.test.*}');
	// 			vscode.window.showInformationMessage(`Found ${files.length} files`);
	// 			files.map(async (file) => {
	// 				let filePath = file.fsPath;
	// 				let fileName = file.fsPath.split('/').pop();
	// 				let testFileName = `${fileName!.replace('.ts', '.test.ts').replace('.js', '.test.js')}`;
	// 				let testFilePath = `${testFileName}`;
	// 				/* determine the framework used */
	// 				let framework = '';
	// 				// get the filename without path and extension
	// 				let component = fileName!.split('\\').pop()!.split('/').pop()!.split('.')[0];
	// 				vscode.workspace.openTextDocument(filePath).then(async (document) => {
	// 					if (document.getText().includes('react')) {
	// 						framework = 'react';
	// 					}	
	// 					let content = framework !== 'react' ? 'currently not supported' : `import React from \'react\';\nimport {render} from \'@testing-library/react\'\nimport ${component} from \'./${component}\'\n\ndescribe('${component}', () => {\n\tit('renders without crashing', () => {\n\t\trender(${component}())\n\t})\n})\n`;
	// 					let testFileContent = content;

	// 				writeFile(testFilePath, testFileContent, 'utf8', (err) => {
	// 					if (err) {
	// 						return err;
	// 					}
	// 					return;
	// 				});
	// 					vscode.window.showInformationMessage(`Created ${testFilePath}`);
	// 				});
	// 			});
	// 		}
	// 	});
	// });

	// context.subscriptions.push(disposableExtractTestFiles);

	let disposableExtractTestFilesFramework = vscode.commands.registerCommand('test-extractor.extractTestFilesFramework', async () => {
		let rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
		let pkgJsonContent = await vscode.workspace.openTextDocument(`${rootPath}/package.json`);
		let pkgJson = JSON.parse(pkgJsonContent.getText());
		let framework = pkgJson.dependencies.react ? 'react' : '';
		let files = await vscode.workspace.findFiles(`**/*.{ts,js,tsx,jsx}`, '{**/node_modules/**,**/vscode/**,**/**/*.test.*}');
		vscode.window.showInformationMessage(`Found ${files.length} files`);
		files.map(async (file) => {
			let filePath = file.fsPath;
			let fileName = file.fsPath.split('/').pop();
			let testFileName = `${fileName!.replace('.ts', '.test.ts').replace('.js', '.test.js')}`;
			let testFilePath = `${testFileName}`;
			// get the filename without path and extension
			let component = fileName!.split('\\').pop()!.split('/').pop()!.split('.')[0];
			vscode.workspace.openTextDocument(filePath).then(async (document) => {
				let testFileContent = '';
				testFileContent += getTestTemplate(framework, component, document.getText());
			writeFile(testFilePath, testFileContent, 'utf8', (err) => {
				if (err) {
					return err;
				}
				return;
			});
				vscode.window.showInformationMessage(`Created ${testFilePath}`);
			});
		});
	});

	context.subscriptions.push(disposableExtractTestFilesFramework);
}

export function deactivate() {
	vscode.window.showInformationMessage('Sad to see you go!');
}
function getTestTemplate(framework: string, component: string, fileContent: string): string {
	let testTemplate = '';
	let functionsTests = '';
	functionsTests = getTestContent(fileContent, component);
	switch (framework) {
		case 'react':
			testTemplate = `import React from 'react';\nimport {render} from '@testing-library/react'\nimport ${component} from \'./${component}\'\n\ndescribe('${component}', () => {\n\tit('renders without crashing', () => {\n\t\trender(${component}())\n\t})\n${functionsTests}})\n`;
			break;
		default:
			testTemplate = `currently not supported`;
			break;
	}
	return testTemplate;
}

function getTestContent(fileContent: string, component: string): string {
	// determine the functions used in the file
	let testContent = '';
	let functions = Array<string>();
	let lines = fileContent.split('\n');
	lines.map((line) => {
		// test if line is function or arrow function
		if (line.includes('function') || line.includes('=>')) {
			line = line.trim();
			let isLineFunction = isFunction(line);
			if (isLineFunction) {
				// do something fancy
				let parts = line.split(' ');
				let indexName = parts.indexOf('function') + 1;
				indexName = indexName ? indexName : parts.indexOf('const') + 1;
				let functionName = parts[indexName];
				functions.push(functionName);
			}
		}	
	});
	functions.map((func) => {
		testContent += `\tit.todo('${func} should do something');\n`;
	});
	return testContent;
}

function isFunction(line: string): boolean {
	let isLineFunction = false;

	if (line.includes('function')) {
		isLineFunction = true;
	}

	if (line.includes('=>') && line.includes('const ') && line.includes('=')) {
		isLineFunction = true;
	}

	return isLineFunction;
}

