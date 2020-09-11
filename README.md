# Actuarial simulator | Individual pension

This simulator allows to calculate individual pensions provided by a capitalisation pension scheme.

The mortality table is from public sources (World Bank).

View it live @ http://simulateur-retraite.benjaminroger.com/

## How it works
The initial values are submitted through a form in the homepage, to an exposed API (output.js) via AJAX.

The API returns the rendered results, including charts.

The rendered results are displayed with Ajax in a container below the form.

## Technologies
The simulator relies on NodeJS/ExpressJS

Notable libraries: Papaparse, EJS

## How to start
Clone this repo.
Enter the folder.
Type the command 
```code
npm i && node app.js
```
