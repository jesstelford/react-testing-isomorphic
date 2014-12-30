*This is __Part 3__ of the series* "Modular Isomorphic React JS applications".
*See [Part 1](https://github.com/jesstelford/react-isomorphic-boilerplate) and
[Part 2](https://github.com/jesstelford/react-testing-mocha-jsdom) for more.*

# Unit testing Isomorphic React Components

**tl;dr**: *Isomorphic rendering with forms can be a painful combination. React
has us covered with `refs` and `componentDidMount()`, but we still need to unit
test those solutions.*

As we learned in [Part
1](https://github.com/jesstelford/react-isomorphic-boilerplate), React is really
powerful when used to build Isomorphic applications. Unfotunately, it has a
[gotchya](https://github.com/jesstelford/react-isomorphic-boilerplate#state-change-and-slow-loading-javascript)
when dealing with state change and slow loading Javascript:

> When the user is on a slow connection (mobile, for example), the
> `public/js/bundle.js` script file may take some time to download. During this
> time, the user is already presented with the form and can begin interacting
> with the checkbox.
>
> Unfortunately, if the user toggles the checkbox to `checked`, when React
> renders the DOM, it will not detect the changed state, instead using the
> passed in state as the source of truth (as it rightly should).

As pointed out further in the tutorial, we can use
[`refs`](https://facebook.github.io/react/docs/more-about-refs.html) and
[`componentDidMount()`](https://facebook.github.io/react/docs/component-specs.html#mounting-componentdidmount)
to mitigate the effects, and update the state as soon as React is done browser
side rendering.

But, we still need to test this aspect (our Mobile Users need to have the best
possible experience too!)

Continuing on from [Part
2](https://github.com/jesstelford/react-testing-mocha-jsdom), we will use
[Mocha](http://mochajs.org/) + [jsdom](https://github.com/tmpvar/jsdom) to build
out test cases for covering this sutation.

## Let's do it

**tl;dr**: *[Get the completed
example](https://github.com/jesstelford/react-testing-isormorphic)*

We'll be using these libraries:

 * [Node.js](http://nodejs.org)
 * [npm](https://www.npmjs.org)
 * [React](https://www.npmjs.com/package/react) - ^0.12.0
 * [react-tools](https://www.npmjs.com/package/react-tools) - to compile JSX to JS
 * [Mocha](http://mochajs.org/) - testing framework and runner
 * [jsdom](https://github.com/tmpvar/jsdom) - headless DOM for React to use in tests

Our code structure will look like this:

```
├── common
│   └── components  # All our react components
├── lib
│   └── components  # Our jsx-compiled components
└── test
    └── components  # Unit tests for components
```

### `todo-item.js` React component

We previously built the component `common/components/todo-item.js` in [Part 1](https://github.com/jesstelford/react-isomorphic-boilerplate#server-side-rendering):

```javascript
// file: common/components/todo-item.js
var React = require('react');

module.exports = React.createClass({
  displayName: 'TodoItem',

  /**
   * Lifecycle functions
   **/
  getInitialState: function() {
    return { done: this.props.done }
  },

  componentDidMount: function() {
    this.setDone(this.refs.done.getDOMNode().checked);
  },

  render: function() {
    return (
      <label>
        <input ref="done" type="checkbox" defaultChecked={this.state.done} onChange={this.onChange} />
        {this.props.name}
      </label>
    );
  },

  /**
   * Event handlers
   **/
  onChange: function(event) {
    this.setDone(event.target.checked);
  },

  /**
   * Utilities
   **/
  setDone: function(done) {
    this.setState({ done: !!done});
  }
});
```

*Notice our use of `componentDidMount()` on line 14, and our use of `refs` on
lines 15 & 21*

Since this component contains JSX, we must build it before we can use it by
executing `./node_modules/.bin/jsx common/components/ lib/components/` (also
executable via `npm run jsx` in the example repo). This will save the built file
into `lib/components/todo-item.js`

### jsdom

Previously, we setup jsdom with a simple DOM consisting of an empty `<body>`,
this time we want to set it up to mimic what our isomorphic server would have
rendered. We can see from [Part
1](https://github.com/jesstelford/react-isomorphic-boilerplate#server-side-rendering),
that it looks like this (thanks to `React.renderToString()`):

```html
<label data-reactid=".e8wbttvlkw" data-react-checksum="-1336527625"><input type="checkbox" data-reactid=".e8wbttvlkw.0"><span data-reactid=".e8wbttvlkw.1">Write Tutorial</span></label>
```

*Remember: [space is important](https://github.com/jesstelford/react-isomorphic-boilerplate#space-is-important), don't prettify the HTML!*

This gives us a final `test/setup.js` file like:

```javascript
// file: test/setup.js
var jsdom = require('jsdom');

// Simulating a server-side rendered component
// This was obtained via React.renderToString()
// Store this DOM and the window in global scope ready for React to access
global.document = jsdom.jsdom('<!doctype html><html><body><label data-reactid=".e8wbttvlkw" data-react-checksum="-1336527625"><input type="checkbox" data-reactid=".e8wbttvlkw.0"><span data-reactid=".e8wbttvlkw.1">Write Tutorial</span></label></body></html>');
global.window = document.parentWindow;
```

### A Mocha Test

**tl;dr**: *Get the completed test file in the example repo at
[test/component/todo-item.js](https://github.com/jesstelford/react-testing-isormorphic/blob/master/test/component/todo-item.js)*

Using a similar approach to our tests in [Part 2](https://github.com/jesstelford/react-testing-mocha-jsdom#a-mocha-test), we start with what we want to test:

```javascript
// file: test/component/todo-item.js
var assert = require('assert');

describe('Todo-item component', function(){

  it('is checked before React mount', function() {
    assert(this.isomorphicInputElement.checked === true);
  });

  describe('after React mount, <input>', function() {

    it('should be checked', function() {
      assert(this.inputElement.checked === true);
    });

    it('should be identical DOM element', function() {
      assert(this.inputElement === this.isomorphicInputElement);
    });

    it('has checked state', function() {
      assert(this.renderedComponent.state.done === true);
    });

  });

});
```

Let's start with getting access to `this.isomorphicInputElement`. jsdom has us
covered here, as we've setup the global `document` in `test/setup.js`, allowing
us to query it with `getElementsByTagName`:

```javascript
// file: test/component/todo-item.js
var assert = require('assert');

describe('Todo-item component', function(){

  before('setup DOM', function() {

    this.isomorphicInputElement = document.getElementsByTagName('input')[0]

  });

  // [...]
});
```

#### Mimicing slow loading JS

You'll notice in our first test, we are asserting `.checked === true`, but keep
in mind when we generated the static html, the component's state is `done:
false`.

This is where we simulate a user having access to the DOM before the JS has
finished downloading; We *check* the checkbox:

```javascript
// file: test/component/todo-item.js
var assert = require('assert');

describe('Todo-item component', function(){

  before('setup DOM', function() {

    this.isomorphicInputElement = document.getElementsByTagName('input')[0]

    // Simulate a click on the DOM element to check the checkbox
    this.isomorphicInputElement.checked = true;

  });

  // [...]
});
```

This allows our first test to run successfully; `npm test` should give output
similar to:

```
  Todo-item component
    ✓ is checked before React mount 
    after React mount, <input>
      1) should be checked
      2) has checked state
      3) should be identical DOM element


  1 passing (11ms)
  3 failing

  1) Todo-item component after React mount, <input> should be checked:
     TypeError: Cannot read property 'checked' of undefined

  2) Todo-item component after React mount, <input> has checked state:
     TypeError: Cannot read property 'state' of undefined

  3) Todo-item component after React mount, <input> should be identical DOM element:
     AssertionError: false == true
```

So far, so good!

#### Rendering React browser side

We use an almost identical pattern as we did in [Part
2](https://github.com/jesstelford/react-testing-mocha-jsdom#a-mocha-test) (with
some different variable names) to setup the rendering for React browser side (in
`before('mount React', function() {`):

```javascript
// file: test/component/todo-item.js
var assert = require('assert');

describe('Todo-item component', function(){

  before('setup DOM', function() {
    // [...]
  });

  it(/* [...] */)

  describe('after React mount, <input>', function() {

    before('mount React', function() {

      // Create our component
      // Note that the state here and the state server side (when rendering the
      // isomorphic HTML) must match. This ensures the HTML React searches for
      // matches the HTML we have given to jsdom
      this.component = TodoItemFactory({
        done: false,
        name: 'Write Tutorial'
      });

      // We want to render into the <body> tag
      this.renderTarget = document.getElementsByTagName('body')[0];

      // Now, render
      this.renderedComponent = React.render(this.component, this.renderTarget);

      // Searching for <input> tag within rendered React component
      // Throws an exception if not found
      this.inputComponent = TestUtils.findRenderedDOMComponentWithTag(
        this.renderedComponent,
        'input'
      );

      this.inputElement = this.inputComponent.getDOMNode();
    });

    it(/* [...] */)

  });
});
```

With this, we are rendering React into the same `renderTarget` as the server
side isomorphic render (the `<body>` tag). We then search for the `<input>` tag
using React's `TestUtils` and store the found components in
`this.renderedComponent` / `this.inputComponent` / `this.inputElement` ready for
our tests to assert against.

#### React's smart Virtual DOM

React is smart enough (thanks to its Virtual DOM) to not wipe out our
isomorphically rendered DOM element, allowing the next two tests to pass:

```javascript
it('should be checked', function() {
  assert(this.inputElement.checked === true);
});

it('should be identical DOM element', function() {
  assert(this.inputElement === this.isomorphicInputElement);
});
```

And, we can assert that our code in `componentDidMount()` was successfully
executed by checking on the state:

```javascript
it('has checked state', function() {
  assert(this.renderedComponent.state.done === true);
});
```

#### Conclusions

With all 4 of these tests executed, we have asserted that:

 * The isomorphic rendered checkbox can be `checked` before the React JS has
   loaded and executed
 * Once the React JS is loaded and executed;
   * The DOM element is **not** erased
   * The React component's state is correctly updated

All together now, and we end up with a complete test that can be run with
`./node_modules/.bin/mocha --recursive` (alternatively can be run as `npm test`
in the example repo):

```javascript
// file: test/component/todo-item.js
var React = require('react/addons'),
    assert = require('assert'),
    TodoItem = require('../../lib/components/todo-item'),
    TestUtils = React.addons.TestUtils,
    // Since we're not using JSX here, we need to wrap the component in a factory
    // manually. See https://gist.github.com/sebmarkbage/ae327f2eda03bf165261
    TodoItemFactory = React.createFactory(TodoItem);

describe('Todo-item component', function(){

  before('setup DOM', function() {

    this.isomorphicInputElement = document.getElementsByTagName('input')[0]

    // Simulate a click on the DOM element to check the checkbox
    this.isomorphicInputElement.checked = true;
  });

  it('is checked before React mount', function() {
    assert(this.isomorphicInputElement.checked === true);
  });

  describe('after React mount, <input>', function() {

    before('mount React', function() {

      // Create our component
      this.component = TodoItemFactory({
        done: false,
        name: 'Write Tutorial'
      });

      // We want to render into the <body> tag
      this.renderTarget = document.getElementsByTagName('body')[0];

      // Now, render
      this.renderedComponent = React.render(this.component, this.renderTarget);

      // Searching for <input> tag within rendered React component
      // Throws an exception if not found
      this.inputComponent = TestUtils.findRenderedDOMComponentWithTag(
        this.renderedComponent,
        'input'
      );

      this.inputElement = this.inputComponent.getDOMNode();
    });

    it('should be checked', function() {
      assert(this.inputElement.checked === true);
    });

    it('should be identical DOM element', function() {
      assert(this.inputElement === this.isomorphicInputElement);
    });

    it('has checked state', function() {
      assert(this.renderedComponent.state.done === true);
    });

  });
});
```

##### Results

```bash
$ npm test

> react-testing-mocha-jsdom@1.0.0 test /home/teddy/dev/react-mocha-jsdom
> mocha --recursive



  Todo-item component
    ✓ is checked before React mount 
    after React mount, <input>
      ✓ should be checked 
      ✓ should be identical DOM element 
      ✓ has checked state 


  4 passing (23ms)
```
