grammar PlasticsLang;

WHITE_SPACE: [ \u000B\t\r\n] -> channel(HIDDEN);

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

TURINARY_: '?';

COLON_: ':';

GT_: '>';

LT_: '<';

EQEQ_: '=' '=';

GTEQ_: '>' '=';

LTEQ_: '<' '=';

MIN_: 'm' 'i' 'n';

MAX_: 'm' 'a' 'x';

BOUND_: 'b' 'o' 'u' 'n' 'd';

LCURLY_: '{';

RCURLY_: '}';

IDENTIFIER_: [A-Za-z0-9]+;

number: (FLOAT_ | INTEGER_);

identifier: IDENTIFIER_ (PERIOD_ IDENTIFIER_)*;

cap: (MIN_ | MAX_);

bound: BOUND_;

expression: number # simpleExpression
  | identifier # simpleIdentifier
  | expression op=(MULT_ | DIV_ | POW_) expression  # multiplyExpression
  | expression op=(ADD_ | SUB_) expression # additionExpression
  | LPAREN_ expression RPAREN_ # parenExpression
  | op=cap LPAREN_ operand=expression COMMA_ limit=expression RPAREN_  # callCap
  | bound LPAREN_ operand=expression COMMA_ lower=expression COMMA_ upper=expression RPAREN_  # callBound
  | expression op=(GT_ | LT_ | EQEQ_ | LTEQ_ | GTEQ_) expression  # condition
  | expression TURINARY_ expression COLON_ expression  # conditional
  ;

definition: VAR_ identifier EQ_ expression;

assignment: identifier EQ_ expression;

command: definition | assignment;

program: command (SEMICOLON_ command)* SEMICOLON_;
