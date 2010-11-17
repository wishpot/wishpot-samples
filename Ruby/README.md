This is a simple file that runs through a number of the common REST API calls, both authenticated and unauthenticated.

For Ruby, these code samples rely upon the [Ruby OAuth Gem](http://oauth.rubyforge.org) to provide the OAuth functionality.

Simple example for searching Wishpot for a list:

     consumer = OAuth::Consumer.new(PUBLIC_KEY, PRIVATE_KEY, {
        :site=>'http://www.wishpot.com',
        :request_token_path=>"/api/RequestToken.ashx",
        :access_token_path=>"/api/AccessToken.ashx",
        :authorize_url=>"https://www.wishpot.com/secure/signin.aspx"
        })

     results = consumer.request(:get, '/restapi/List/Search?List.LastName=ciccotosto', nil {}, {})

Other examples in the code show how to exchange a request token for an access token, and then access protected resources on behalf of users.
