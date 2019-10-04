# Don't Break the Chain

## Getting started with the project.

### To Create a new Discord Bot

Before you create your application, either create a discord server of your own, or choose a server that you have administrative access to that will be the guinea pig for your application.

You have to create an application. Go to [the discord developers portal](https://discordapp.com/developers) and login. Create a New Application here. Name it whatever you want.

Once you are on the general information page for your application, click on the "Bot" navigation on the left hand side of the screen. Click "Create Bot".

Once the bot is created, click the "OAuth2" navigation above the "Bot" navigation on the left hand side of the screen. Scroll down to the Scopes on the and choose the "bot" option. Once you choose the "Bot" option a new set of "Bot Permissions" will show up below the "Scopes" section. Check off the "Administrator" option in the "Bot Permissions" section. Back at the "Scopes" section, underneath the checkboxes, a long url should have a "Copy" button on it. Press the Copy button, then open a new tab and past the url that should be on your clipboard.

This new screen gives you the ability to add the bot to the server that you are administrator for. Choose your test server. It should be added to your server, but it should come across as offline.

### Once you have a bot account running
On your discord application page, click "Bot" and in the center of the screen you should see the "Token" header with the "Copy" and "Regenerate" buttons underneath it. Click the "Copy" button to get the token onto your clipboard.

With a cloned repository of "dbtc" downloaded, copy the `env-example` file into `.env` and fill in the `TOKEN` value with the contens of your clipboard. Do not put the contents of the clipboard into any kind of quotes.

### Once you have the environment prereq's 
With this available to the system you should be able to install the npm dependancies with `npm install` and then run `npm run start` to make the system build once and run the build. 

If you would like to actively develop with auto-refresh on save try `npm run develop`.


## Unit Tests
At time of writing, unit tests are limited and not well-fleshed out, this is a great opportunity for development.

# Project Overview
The `index.ts` file defines all of the commands, with references to the models to do most of the heavy lifting for each command. The 'database' is just a flat json file, managed by the `models/Database.ts` file.