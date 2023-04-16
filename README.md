# HTML Email Pugger
A tool for creating HTML email templates using Pug and SCSS.

## Requirements
Node.js

## Installation
Clone or download the repository
Run `npm install`

## Usage
Create your Pug templates in the src/templates folder.
Write the corresponding SCSS styles in the src/styles folder. The name of the SCSS file should match the name of the Pug template.
Run `npm start` to start the development server and compile your templates.
Preview your templates at http://localhost:8080.
When you're done, the compiled templates will be in the dist folder.

## Features
Automatically compiles Pug templates and SCSS stylesheets
Inlines CSS for use in HTML emails
Minimizes CSS for smaller file size
Live reloading for fast development

## Notes
The tool uses Gulp.js as the task runner.
The global styles are included automatically for all templates.
Template-specific styles are included if a matching SCSS file is found.
The compiled templates will have inlined CSS and minimized CSS, but not the original CSS files.
The development server uses BrowserSync to enable live reloading.
License
This tool is released under the MIT License. See LICENSE file for details.