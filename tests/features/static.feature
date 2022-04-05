Feature: Static files
  Scenario: /  
    When I visit /
    Then I should get status code 200
    And  I should get header "Content-Type: text/html"
    And  I should get HTML title "SF.gov archive"
