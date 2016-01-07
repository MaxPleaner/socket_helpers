require "socket_helpers/version"
require 'rails'

module SocketHelpers
  class MyRailtie < Rails::Railtie
  end
  module ControllerHelpers
    require 'oj'
    def public_attrs(record)
      attrs = record.attributes.merge('record_class' => record.class.to_s.underscore)
      return Oj.dump(attrs)
    end
    def websocket_response(records, action)
      records = [records] unless records.is_a?(Array)
      records.each do |record|
        class_name = record.try(:published_class) || record.class.to_s.underscore
        puts "triggered #{class_name} #{action}"
        WebsocketRails[class_name].trigger(action, public_attrs(record))
      end
    end   
  end
  class Engine < Rails::Engine
    initializer "my_engine.remove_rack_lock" do |app|
      app.middleware.delete Rack::Lock
    end
    initializer :assets do |config|
      Rails.application.config.assets.precompile += %w{ socket_helpers.js }
      Rails.application.config.assets.paths << root.join("app", "assets", "javascripts")
    end
  end
end
