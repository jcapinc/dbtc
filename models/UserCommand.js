"use strict";
exports.__esModule = true;
var UserCommand = /** @class */ (function () {
    function UserCommand(matcher, action) {
        this.action = action;
        this.matcher = matcher;
        this.setOutMethod(function (output) { return console.log(output); });
    }
    UserCommand.prototype.setOutMethod = function (method) {
        this.outMethod = method;
    };
    UserCommand.prototype.shouldHandle = function (userInput) {
        return this.matcher.test(userInput.content);
    };
    UserCommand.prototype.handle = function (userInput) {
        return this.action.call(this, userInput);
    };
    UserCommand.setAllOutputMethods = function (method) {
        this.commands.map(function (cmd) { return cmd.setOutMethod(method); });
    };
    UserCommand.register = function (command) {
        this.commands.push(command);
    };
    UserCommand.getCommandByMatcher = function (matcher) {
        return this.commands.filter(function (cmd) { return cmd.matcher === matcher; })[0];
    };
    UserCommand.process = function (userInput) {
        for (var _i = 0, _a = this.commands; _i < _a.length; _i++) {
            var command = _a[_i];
            if (command.shouldHandle(userInput)) {
                return command.handle(userInput);
            }
        }
    };
    UserCommand.commands = [];
    return UserCommand;
}());
exports.UserCommand = UserCommand;
