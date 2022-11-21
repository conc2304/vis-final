# The Three Planeteers present Climate Change : Is Earth Fighting Back?

## Getting Started

Do you have node installed on your computer? No?
Follow these instructions: 
Mac Terminal: [How to install NodeJS and NPM on Mac using Homebrew](https://medium.com/@hayasnc/how-to-install-nodejs-and-npm-on-mac-using-homebrew-b33780287d8f)
or
Download the the os specific NodeJs [installer](https://nodejs.org/en/download/)

Once you have NodeJs installed on your computer you will be able to run this React Application locally.

In a terminal window go to the root folder of the project (aka the project directory)
Run this command once:  
- `npm install` - installs the project dependencies

Run everytime you want to relaunch the application locally on your computer:
- `npm start` - starts the application and launches it in the browser
- If it doesnt open it in your browser : Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

## Available Scripts

In the project directory, you can run:

### `npm install`

Installs all of the project dependencies from the package.json file.
You only have to run this once before running `npm start` to launch the application. 

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.


## Project Directory Structure

- src/App.tsx - the entry file of the project, think of it like index.html
- src/components/visualizers/*.tsx -  the d3 charts written as React Components ie HeatMap.tsx
- public - the public directory that serves any non web specific asses (images, csv files, json files, etc...)
- public/data - public directory that is serving the locally hosted data that is driving the application

