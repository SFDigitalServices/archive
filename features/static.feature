Feature: archive.sf.gov
  Scenario: / redirect
    When I visit /
    Then I should be redirected to https://sf.gov/

  Scenario: *.herokuapp.com ServerAlias
    Given request headers:
      | Host | sfgov-archive.herokuapp.com |
    When I visit /
    Then I should be redirected to https://sf.gov/

  Scenario: /robots.txt
    When I visit /robots.txt
    Then I should get status code 200
    Then I should get header "Content-Type" containing "text/plain"
