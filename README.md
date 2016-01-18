# SocketHelpers

### Usage /Installation

_(these instructions can be seen implemented in the [socket_helpers_example](http://github.com/maxpleaner/socket_helpers_example) repo_ or seen [on a live site](http://socket-helpers-example.herokuapp.com)

---

####
**create rails app** `rails new App; cd App;`

**create a model** `rails g scaffold Todo content:string; rake db:migrate;`

**add gems** `gem 'socket_helpers'` and `gem 'websocket-rails'`

**add javascript requires to application.js**

- `//= require websocket_rails/main`
- `//= require socket_helpers`

**add jquery initializer** for whatever models you need websocket resources for (singular, snake case).

 ```javascript
   $(function(){
    SocketHelpers.initialize(["todo"], "http://localhost:3000/websocket")
   })
 ```
- the default websocket url (from the websocket-rails gem) is "/websocket"

**include the controller helpers to application_controller**
 
 ```ruby
   class ApplicationController < ActionController::Base
     include SocketHelpers::ControllerHelpers
   end
 ```

**Remove the default scaffold routes** (`resources :todos`). This gem supports only query parameters, not path parameters. This limitation only applies to `websocket_response` endpoints. Other endpoints can use path parameters.

- i.e. parameters are never declared in the routes.rb file, but they are declared in controllers. For example, routes like `DELETE /todos/MY_TODO_ID` are not supported, but `DELETE /todos?id=MY_TODO_ID` are.

**Create a HTML-serving endpoint** `rails g controller HtmlPages root`

**Create websocket API endpoints and write routes**
 
 ```ruby
   # routes.rb
   get "/", to: "html_pages#root"
   post "todos", to: "todos#create"
   delete "todos", to: "todos#destroy"
 ```

 ```ruby
   # app/controllers/todos_controller.rb
   # all the default scaffold stuff can be deleted
   class TodosController < ApplicationController
     def create
       todo = Todo.create(todo_params)
       websocket_response(todo, "create")
       return false
     end
     def destroy
       todo = Todo.find_by(id: params[:id])
       todo.destroy
       websocket_response(todo, "destroy")
       return false
     end
     def todo_params
       params.permit(:content)
     end
   end
 ```
- the first argument of `websocket_response` can be a single record or an array. _It cannot be a query_. The second can be either `create`, `destroy`, or `update` (these values hard-coded into the app. The receiver-hooks for these events are automatically created by the javascript client. 

- make sure to add a 'return' or 'render' after `websocket_response` to avoid "template not found" errors.

**use the DSL for HTML** in html_pages/root.html.erb. See below for a list of HTML components available.

  ```html
  
    <h3>Create todo</h3>
    
    <%# This form will submit via AJAX %>
    <%# all forms do this by default. use <form skip-sockets> to prevent it.%>
    <form action="todos" method="POST">
      <input type="text" name="content" placeholder="content">
      <input type="submit" value="submit">
    </form>
    
    <%# a class value of "model_name-index" is special %>
    <%# and sets up this section as a container for a list of records %>
    <div class="todo-index">
      <h3>Todos</h3>
      <p template> <%# special attr defines this as the template for added records %>
        <span template-attr="content"></span><%# two-way databinding for 'content %>
        <form action="/todos" method="POST"
          <input type="hidden" name="_method" value="DELETE"
          <input type="hidden" name="id" template-attr="id"
          <input type="submit" value="remove"></input>
        </form>
        <br>
      </p>
      </ul>
    </div>
    
    <%# define some todos which will initially appear on the page %>
    <%# This serialization is done automatically during 'websocket_response' %>
    <% @todos = Todo.limit(1).map do |todo| %>
    <%   todo.attributes.merge('record_class' => 'todo') %>
    <% end %>
    
    <%# initial data for the page %>
    <%# update and delete listeners are set up for these ids %>
    <div init="todo">
      <%= Oj.dump @todos.to_a %>
      <%# make sure not to dump a query %>
    </div>
  ```

- This provides working 'index, 'create', and 'destroy' websocket functionality in quite few lines of HTML, which is mainly the point of this gem. 'update' is automatic as well. When a record is added to the page, a `record-id` attribute is automatically set to `<record_class>,<id>` on the newly-added template. This is used to lookup records. 

**remove CSRF token check**

comment out the `protect_from_forgery with: :exception` line in application_controller

**start rails server** `rails s;`, open [localhost:3000](http://localhost:3000)

It is a working todo-app with websockets. Try opening two browser windows at once. 

---

### **List of HTML components**

- elements with a class of `<model_name>-index` become lists, with elements auto-removed and added in response to websocket events. For example, `<div class="todo-index"></div>`. These sections correspond to a single ActiveRecord class (underscore, singular i.e. `todo_list_item` for `TodoListItem`)

- inside a `<model_name>-index` element, an element with a `template` attribute becomes the template for added records. For example, `<div template></div>`

- inside a `[template]` element, the `template-attr` attribute is used to establish two-way databinding on an element. Its value is the name of the attribute. This can be used to set the value of form inputs or to change text nodes. For example,

```html
  <input type="text" name="content" template-attr="content">
  <!-- or alternatively -->
  <span template-attr="content">
```

- **all form submits are intercepted** by event listeners by default. To override this, add the "skip-sockets" attribute to the form element. They submit AJAX requests using the url in the form's `action` attribute and the method in the form's `method` attribute (i.e. `action="/todos" method="POST"`). This works for `GET` and `POST` only, but `PUT` and `DELETE` can be used by adding a hidden input method i.e. `input type="hidden" name="_method" value="PUT"`. This is the default Rails behavior anyway.

- To submit an id with a form, bind a hidden attribute i.e. `<input type="hidden" name="id" template-attr='id'>`

- Outside of `[template]`s, binding tags are a bit more verbose. `<span binding-tag='todos,1,content'></span>` where the three comma-separated arguments are `<model_class>`, `<id>`, and `<attribute>`. `template-attr` tags are automatically converted to `binding-tag` once new records are added to the page. 

---

### **Other notes**

#### **Changing a classes' published class name

- Say I created a `LocationCategorization` scaffold but
  realized that I would rather publish the data  using 
  a `record_class` value of `category` instead of `location_categorization`.
  I don't want to undo the scaffold, so I add a method to the `LocationCategorization` class:

  ```ruby
    class LocationCategorization < ActiveRecord::Base
      def published_class
        "category"
      end
    end
  ```

This particular method name is used as an optional override
for the default published class name (`record.class.to_s.underscore`)

#### **Loading initial data on the page**

Without doing this, the page will be empty every time it is refreshed. The page needs to start out with a list of records loaded.

Create an html element with an `init` attribute set to a model class, i.e. `todo`. This element will be auto-hidden. In the html-serving controller method, make an instance variable for whatever data is going to be included (expects an array, not a single object or query). On the html page, use ERB to set the content of the `[init]` element to a JSON stringified version of your instance variable. For example, `<div init="todo"><%= Oj.dump([User.first]) %></div>`

#### **How to do links with params**

i.e. how to do

```html
<a href="/my_link?with=params">My Link </a>
```

The way to do this is by building a form and disguising it as a link. Basically come up with some CSS style so the form looks like a link. I don't really know how to do the CSS, but the form HTML code is below. This has the effect of creating a button on the page with the desired link follow-through when clicked. In this example, the 'link-style' class has to be externally implemented.

```html
<form skip-sockets class="link-style" action="/notepad" method="GET">
  <input type="hidden" name="name" template-attr='name'>
  <input type="submit" template-attr='name'>
</form>

```



### **Additional Helpers**

you can make one html element toggle another open / close very easily.

Just make them 'siblings (share the same parent element) and give the trigger a `toggles` attribute with a value set to the CSS selector of the target. The target will be initially closed. 

---

### **Use of OJ gem for JSON**

- I use the OJ gem here and `Oj.dump` because of an unsolved recursion bug in `to_json` I encountered.