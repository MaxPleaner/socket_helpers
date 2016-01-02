# SocketHelpers

### Usage /Installation

_(these instructions can be seen implemented in the [socket_helpers_example](http://github.com/maxpleaner/socket_helpers_example) repo_

---

#### 1.
**create rails app** `rails new App; cd App;`

---

#### 2.

**create scaffold** `rails g scaffold Todo content:string; rake db:migrate`

---

#### 3.

**add gem** `echo -e "\n gem 'socket_helpers'" >> Gemfile; bundle;`

---

#### 4.

**add javascript requires to application.js**

- `//= require websocket-rails/main`
- `//= require socket_helpers`

---

#### 5.

**add jquery initializer** for whatever models you need websocket resources for

 ```javascript
   $(function(){
    SocketHelpers.initialize(["todo"])
   })
 ```
---

#### 6.

**include the controller helpers to application_controller**
 
 ```ruby
   class ApplicationController < ActionController::Base
     include SocketHelpers::ControllerHelpers
   end
 ```

---

#### 7.

**Remove the default scaffold routes** (`resources :todos`). This gem supports only _query_ parameters, not _path_ parameters.

- i.e. parameters are never declared in the routes.rb file, but they are declared in controllers. For example, routes like `DELETE /todos/MY_TODO_ID` are not supported, but `DELETE /todos?id=MY_TODO_ID` are.

---

#### 8.

**Create a HTML-serving endpoint** `rails g controller HtmlPages root`

---

#### 9.

**Create websocket API endpoints and write routes**
 
 ```ruby
   # routes.rb
   get "/", to: "html_pages#root"
   post "todos", to: "todos#create"
   delete "todos", to: "todos#destroy"
 ```

 ```ruby
   # app/controllers/todos_controller.rb
   class TodosController < ApplicationController
     def create
       todo = Todo.create(todo_params)
       websocket_response(todo, "create")
     end
     def destroy
       todo = Todo.find_by(id: params[:id])
       todo.destroy
       websocket_response(todo, "destroy")
     end
     def todo_params
       params.permit(:content)
     end
   end
 ```

- the first argument of `websocket_response` can be a single record or an array. _It cannot be a query_. The second can be either `create`, `destroy`, or `update`. The receiver-hooks for these events are automatically created by the javascript client. 

---

#### 10.

**use the DSL for HTML** in html_pages/root.html.erb. See below for a list of HTML components available.

  ```html
    <h3>Create todo</h3>
    <form action="todos" method="POST">
      <input type="text" name="content" placeholder="content">
      <input type="submit" value="submit">
    </form>
    <div class="todo_index">
      <h3>Todos</h3>
      <p template>
        <span template-attr="content"></span>
        <form action="/todos" method="POST"
          <input type="hidden" name="_method" value="DELETE"
          <input type="hidden" name="id" template-attr="id"
          <input type="submit" value="remove"></input>
        </form>
        <br>
      </p>
      </ul>
    </div>
    <div init="todo">
      <%= Oj.dump Todo.all %>
    </div>
  ```

- This provides working 'index, 'create', and 'destroy' websocket functionality in quite few lines of HTML, which is mainly the point of this gem. 'update' is automatic as well. When a record is added to the page, a `record-id` attribute is automatically set to `<record_class>,<id>` on the newly-added template. This is used to lookup records. 

---

#### 11.

**start rails server** `rails s;`, open [localhost:3000](http://localhost:3000)

It is a working todo-app with websockets. Try opening two browser windows at once. 

---

### **List of HTML components**

- elements with a class of `<model_name>-index` become lists, with elements auto-removed and added in response to websocket events. For example, `<div class="todo-index"></div>

- inside a `<model_name>-index` element, an element with a `template` attribute becomes the template for added records. These sections correspond to a single ActiveRecord class (underscore, singular i.e. `todo_list_item` for `TodoListItem`). For example, `<div template></div>`

- inside a `[template]` element, the `template-attr` attribute is used to establish two-way databinding on an element. Its value is the name of the attribute. This can be used to set the value of form inputs or to change text nodes. For example, `<input type="text" name="content" template-attr="content">` or `<span template-attr="content">`

- **all form submits are intercepted** by event listeners by default. To override this, add the "skip-sockets" attribute to the form element. They submit AJAX requests using the url in the form's `action` attribute and the method in the form's `method` attribute (i.e. `action="/todos" method="POST"`). This works for `GET` and `POST` only, but `PUT` and `DELETE` can be used by adding a hidden input method i.e. `input type="hidden" name="_method" value="PUT"`. This is the default Rails behavior anyway.

- To submit an id with a form, bind a hidden attribute i.e. `<input type="hidden" name="id" template-attr='id'>`

- Outside of `[template]`s, binding tags are a bit more verbose. `<span binding-tag='todos,1,content'></span>` where the three comma-separated arguments are `<model_class>`, `<id>`, and `<attribute>`. Internally, `template-attr` tags are converted to `binding-tag` once new records are added to the page. 

---

### **Loading initial data on the page**

Witout doing this, the page will be empty every time it is refreshed. The page needs to start out with a list of records loaded.

Create an html element with an `init` attribute set to a model class, i.e. `todo`. This element will be auto-hidden. In the html-serving controller method, make an instance variable for whatever data is going to be included (expects an array, not a single object or query). On the html page, use ERB to set the content of the `[init]` element to a JSON stringified version of your instance variable. For example, `<div init="todo"><%= Oj.dump([User.first]) %></div>`

---

### **Additional Helpers**

you can make one html element toggle another open / close very easily.

Just make them 'siblings (share the same parent element) and give the trigger a `toggles` attribute with a value set to the CSS selector of the target. The target will be initially closed. 

**Caveats**

- I use the OJ gem here and `Oj.dump` because of a recursion bug in `to_json`. I'm still not sure what the cause is, perhaps a naming conflict somewhere.