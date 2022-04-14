Feature: archive.sf.gov
  Scenario: / redirect
    When I visit /
    Then I should be redirected to https://sf.gov/

  Scenario: GET /robots.txt
    When I visit /robots.txt
    Then I should get status code 200
    Then I should get header "Content-Type" containing "text/plain"

  Scenario: $HEROKU_APP_NAME.herokuapp.com alias
    Given request headers:
      | Host | $HEROKU_APP_NAME.herokuapp.com |
    When I visit /
    Then I should be redirected to https://sf.gov/
