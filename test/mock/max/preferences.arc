@sandbox
environment testing

@sandbox-start
ls
echo hi
echo hello #there
echo hello there

@sandbox-startup
echo "hi there"
echo 'hi there'
echo "hi #here"

@create
autocreate true

@deploy
false

@env
testing
  env_var_1 foo
  env_var_2 bar

staging
  env_var_1 fiz
  env_var_2 buz

production
  env_var_1 "qix qix"
  env_var_2 qux qux
