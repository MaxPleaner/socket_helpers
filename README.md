




   i.e parameters are never declared in the routes.rb file, but they are declared in controllers.
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
