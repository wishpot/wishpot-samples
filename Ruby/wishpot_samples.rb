# This sample uses the Ruby OAuth gem to provide the plumbing for the spec
# http://oauth.rubyforge.org

require 'rubygems'
require 'oauth/consumer'

# Your partner keys.  These will be the same in development or test, and are
# *required* for the samples to work
PUBLIC_KEY = 'YOUR_PUBLIC_KEY'
PRIVATE_KEY = 'YOUR_PRIVATE_KEY'

#If you already have an access token for a wishpot user, populate that here
ACCESS_TOKEN = nil
ACCESS_TOKEN_SECRET = nil

#if you do not have an access token, just use a username and password, and
#this sample code will fetch one for you
WISHPOT_EMAIL = nil
WISHPOT_PASSWORD = nil

#switch between test and production
HOST = 'main.test.wishpot.com'  #www.wishpot.com for production
BASE_URL = "http://#{HOST}/"
SECURE_BASE_URL = "https://#{HOST}/"

class Samples
  def self.printline
    puts "------------------------------"
  end

  def self.printresponse(httpresponse)
    printline
    puts "Response code: #{httpresponse.code}"
    puts httpresponse.body
    printline
    puts "\n"
  end
end

consumer = OAuth::Consumer.new(PUBLIC_KEY, PRIVATE_KEY, {
        :site=>BASE_URL,
        :request_token_path=>"/api/RequestToken.ashx",
        :access_token_path=>"/api/AccessToken.ashx",
        :authorize_url=>"#{SECURE_BASE_URL}/secure/signin.aspx"
        })


#####################################################
# A simple, un-authenticated call to /List/Search
#####################################################
puts "Searching for all lists under the last name 'ciccotosto'..."
results = consumer.request(:get,
                            '/restapi/List/Search?List.LastName=ciccotosto',
                            nil,
                            { },
                            { } #if you were :post'ing, the params would be here
                          )
Samples.printresponse(results)



#####################################################
# A call designed to error out
#####################################################
puts "Going to grab my own lists, but not logged in... should return an error:"
results = consumer.request(:get, '/restapi/List/', nil, { }, { } )
Samples.printresponse(results)



#####################################################
# A call to get an access token for a user
#####################################################
access_token = nil
if(ACCESS_TOKEN.nil? && !WISHPOT_EMAIL.nil? && !WISHPOT_PASSWORD.nil?)
  puts "Going to generate an access token for user with address: #{WISHPOT_EMAIL}"
  request_token=consumer.get_request_token
  #this actually does the login, as if the user had opened a browser and done it
  consumer.request(:post,
                   request_token.authorize_url,
                   nil,
                   {},
                   {'EmailAddress'=>WISHPOT_EMAIL, 'Password'=>WISHPOT_PASSWORD}
                   )
  access_token = request_token.get_access_token
  Samples.printline
  puts "Received Access Token "
  puts "\tToken: #{access_token.params['oauth_token']}"
  puts "\tToken Secret: #{access_token.params['oauth_token_secret']}"
  puts "This is what you would store in your system to continue accessing the account of #{WISHPOT_EMAIL}"
  Samples.printline
  puts "\n"
else
  puts "Not demo-ing the ability to generate an access token."
  puts "Add an email address and password if you want to try it."
end

if(access_token.nil? && !ACCESS_TOKEN.nil? && !ACCESS_TOKEN_SECRET.nil?)
  puts "Going to test with the access token you provided: #{ACCESS_TOKEN}"
  access_token = OAuth::AccessToken.new(consumer, ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
end

if(access_token.nil?)
  puts "Not running any more demos, they all require an access token"
  exit
end

#####################################################
#A call that requires authentication... get my own lists
#####################################################
puts "Fetching all the lists for the current user..."
results = access_token.get('/restapi/List/', {})
Samples.printresponse(results)
