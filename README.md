# SocketHelpers

### Installation:

- install to system: `gem install socket_helpers;`
- install with bundler: `gem 'socket_helpers'`

### Usage (these instructions can be seen implemented in the [socket_helpers_example](http://github.com/maxpleaner/socket_helpers_example) repo

- `rails new App; cd App;`
- `rails g scaffold Todo content:string; rake db:migrate`
- `echo -e "\n gem 'socket_helpers'" >> Gemfile; bundle;`
- add javascript requires to application.js
  - `//= require websocket-rails/main`
  - `//= require socket_helpers`
- include the controller helpers to application_controller
 
   ```ruby
     class ApplicationController < ActionController::Base
       include SocketHelpers::ControllerHelpers
     end
   ```

- Remove the default scaffold routes (`resources :todos`). This gem supports only _query_ parameters, not _path_ parameters.
   
i.e. parameters are never declared in the routes.rb file, but they are declared in controllers.

for example, routes like `DELETE /todos/MY_TODO_ID` are not supported, but `DELETE /todos?id=MY_TODO_ID` are.

This may change pending an update to the gem.

 - Write routes for create and destroy like so:

   ```ruby
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
       end
     end
   ```
