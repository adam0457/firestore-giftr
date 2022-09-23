const path = require('path'); //required nodeJS module

module.exports = {
  mode: 'development',
  entry: './src/index.js', //the starter file for our script
  output: {
    path: path.resolve(__dirname, 'docs'), //output folder for the project - I changed it from dist to docs because I only have docs in github pages
    filename: 'bundle.js',
    //name of the compiled JS file inside dist - to be loaded by index.html
  },
  watch: true, //hot reloading when changes are saved inside src folder
};
