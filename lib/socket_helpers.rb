require "socket_helpers/version"
require 'socket_helpers/railtie' if defined?(Rails)

module SocketHelpers
  class MyRailtie < Rails::Railtie
  end
  class MyEngine < Rails::Engine
    initializer "my_engine.remove_rack_lock" do |app|
      app.middleware.remove Rack::Lock
    end
    initializer :assets do |config|
      Rails.application.config.assets.precompile += %w{ socket_helpers.js }
      Rails.application.config.assets.paths << root.join("app", "assets", "javascripts")
    end
  end
end
