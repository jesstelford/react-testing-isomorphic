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
