# PerillaJudger
Judger for Perilla

## Plugins

Perilla-Judger do not provide judge function.
All judge task will be passed to plugin.

### Official supported plugins:

- [traditional](https://github.com/ZhangZisu/perilla-judger-plugin-traditional)
- [POJ](https://github.com/ZhangZisu/perilla-judger-plugin-poj)
- [HDU](https://github.com/ZhangZisu/perilla-judger-plugin-hdu)

### Usage

Create a directory named `plugins` in the project folder

than exec `git clone ${plugin-url} ${plugin-name}` in the plugins directory

eg. `git clone https://github.com/ZhangZisu/perilla-judger-plugin-traditional.git traditional` will install the traditional plugin

When git clone is done, please initalize the plugin following its description.

### How to write your own plugin?

see [demo](https://github.com/ZhangZisu/perilla-judger-plugin-test)

and [here](https://github.com/ZhangZisu/perilla-judger/blob/master/src/interfaces.ts#L44)
