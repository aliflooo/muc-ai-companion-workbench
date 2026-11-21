# AI Workbench

Created using React and Vite.

To run the application, you need to have `npm` installed.
If you don't have Vite installed, you can run the command `npm install vite` to install the dependencies.
Run the command `npm run build` to create the `dist/` folder. In this folder, the static site can be loaded using `index.html`.
Next run the command `npm run dev` to run the actual application. This will open up a `localhost` URI that you can follow to access the AI companion in your browser.
To exit, use the command `CTRL + C`.

`src/main.jsx` contains the checklist, assistant, and diagnostics panels. The app owns step completion state and shares it with the assistant and diagnostic views. The mock assistant replies are handled in `Assistant`, and the simulated board readings live in `Diagnostics`. The overhead camera panel and resistor comparisons use CSS illustrations. Refreshing the page resets the demo.

`src/style.css` contains the desktop layout and responsive breakpoints.

As of 11/20, all of the information is currently hardcoded into the code and dummy data is being used. There is no backend connection to any computer vision components.
