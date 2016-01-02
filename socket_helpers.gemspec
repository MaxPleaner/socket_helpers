# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'socket_helpers/version'

Gem::Specification.new do |spec|
  spec.name          = "socket_helpers"
  spec.version       = SocketHelpers::VERSION
  spec.authors       = ["maxpleaner"]
  spec.email         = ["maxpleaner@gmail.com"]

  spec.summary       = %q{foo}
  spec.description   = %q{foo}
  spec.homepage      = "http://github.com"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").reject { |f| f.match(%r{^(test|spec|features)/}) }
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib", "app/controllers"]

  spec.add_development_dependency "bundler", "~> 1.11"
  spec.add_development_dependency "rake", "~> 10.0"
  spec.add_runtime_dependency "rails"
  spec.add_runtime_dependency 'jquery-rails'
  spec.add_runtime_dependency "jquery-turbolinks"
  spec.add_runtime_dependency "websocket-rails"
  spec.add_runtime_dependency "faye-websocket", '0.10.0'
  spec.add_runtime_dependency "nokogiri"
  spec.add_runtime_dependency 'oj'
  spec.add_runtime_dependency "pry-rails"
end
