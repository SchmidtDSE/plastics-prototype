grammar PlasticsLang;

WHITE_SPACE: [ \u000B\t\r\n] -> channel(HIDDEN);

COMMENT: '#' ~[\r\n]* -> channel(HIDDEN);

FLOAT_: [0-9]+ '.' [0-9]+;

INTEGER_: [0-9]+;

LPAREN_: '(';

RPAREN_: ')';

COMMA_: ',';

MULT_: '*';

DIV_: '/';

ADD_: '+';

SUB_: '-';

POW_: '^';

EQ_: '=';

PERIOD_: '.';

SEMICOLON_: ';';

VAR_: 'v' 'a' 'r';

COND_: 'i' 'f';

ELSE_: 'e' 'l' 's' 'e';

LIMIT_: 'l' 'i' 'm' 'i' 't';

TO_: 't' 'o';

GT_: '>';

LT_: '<';

NEQ_: '!' '=';

EQEQ_: '=' '=';

GTEQ_: '>' '=';

LTEQ_: '<' '=';

LCURLY_: '{';

RCURLY_: '}';

LBRAC_: '[';

RBRAC_: ']';


IDENTIFIER_: [A-Za-z0-9]+;

number: (FLOAT_ | INTEGER_);

identifier: IDENTIFIER_ (PERIOD_ IDENTIFIER_)*;

expression: number # simpleExpression
  | identifier # simpleIdentifier
  | expression op=(MULT_ | DIV_ | POW_) expression  # multiplyExpression
  | expression op=(ADD_ | SUB_) expression # additionExpression
  | LPAREN_ expression RPAREN_ # parenExpression
  | LIMIT_ operand=expression TO_ LBRAC_ limit=expression COMMA_ RBRAC_ # callMax
  | LIMIT_ operand=expression TO_ LBRAC_ COMMA_ limit=expression RBRAC_ # callMin
  | LIMIT_ operand=expression TO_ LBRAC_ lower=expression COMMA_ upper=expression RBRAC_  # callBound
  | pos=expression op=(NEQ_ | GT_ | LT_ | EQEQ_ | LTEQ_ | GTEQ_) neg=expression  # condition
  | pos=expression COND_ cond=expression ELSE_ neg=expression  # conditional
  ;

definition: VAR_ identifier EQ_ expression;

assignment: identifier EQ_ expression;

command: definition | assignment;

program: command (SEMICOLON_ command)* SEMICOLON_;