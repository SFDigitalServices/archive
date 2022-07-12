Feature: archive.sf.gov
  Background: Host header
    Given request header Host: ${TEST_SUBDOMAIN}archive.sf.gov

  Scenario: /
    When I visit /
    Then I should get status code 200
     And I should get header "Content-type" containing "text/html"

  Scenario: /robots.txt
    When I visit /robots.txt
    Then I should get status code 200
     And I should get header "Content-type" containing "text/plain"

  @skip
  Scenario: /sftreasureisland.org/whatever
    When I visit /sftreasureisland.org/whatever
    Then I should be redirected to https://wayback.archive-it.org/18901/3/https://sftreasureisland.org/whatever