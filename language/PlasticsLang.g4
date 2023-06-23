grammar PlasticsLang;

WHITE_SPACE: [ \u000B\t\r\n] -> channel(HIDDEN);

FLOAT_: [0-9]+ '.' [0-9]+;

INTEGER_: [0-9]+;

LPAREN_: '(';

RPAREN_: ')';

MULT_: '*';

DIV_: '/';

ADD_: '+';

SUB_: '-';

POW_: '^';

EQ_: '=';

PERIOD_: '.';

SEMICOLON_: ';';

VAR_: 'v' 'a' 'r';

IDENTIFIER_: [A-Za-z0-9]+;

number: (FLOAT_ | INTEGER_);

identifier: IDENTIFIER_ (PERIOD_ IDENTIFIER_)*;

expression: number # simpleExpression
  | identifier # simpleIdentifier
  | expression op=(MULT_ | DIV_ | POW_) expression  # multiplyExpression
  | expression op=(ADD_ | SUB_) expression # additionExpression
  | LPAREN_ expression RPAREN_ # parenExpression
  ;

definition: VAR_ identifier EQ_ expression;

assignment: identifier EQ_ expression;

command: definition | assignment;

program: command (SEMICOLON_ command)* SEMICOLON_;
