class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  # protect_from_forgery with: :exception

  def public_attrs(record)
    attrs = record.attributes.merge('record_class' => record.class.to_s.underscore.downcase)
    return Oj.dump(attrs)
  end

  def websocket_response(records, action)
    records = [records] unless records.is_a?(Array)
    records.each do |record|
      class_name = record.class.to_s.underscore.downcase
      puts "triggered #{class_name} #{action}"
      WebsocketRails[class_name].trigger(action, public_attrs(record))
    end
    render text: ""
    return false
  end   

end
