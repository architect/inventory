@sandbox
create false

@deploy
false

@env
testing
  env-var-1 foo
  env-var-2 bar

staging
  env-var-1 fiz
  env-var-2 buz

production
  env-var-1 "qix qix"
  env-var-2 qux qux
