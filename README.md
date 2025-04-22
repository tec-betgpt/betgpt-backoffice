# Backoffice BetGPT

## Início rápido

Esse projeto foi construído sobre o [Vue](https://v3.vuejs.) na sua versão 3.x e com a biblioteca de componentes prontos [shadcn](https://www.shadcn-vue.com/), é importante que tenha informações de como funcionam esses frameworks para conseguir trabalhar neste projeto.

É necessário que você tenha o Node.js instalado a partir da versão +20.

### Modo desenvolvimento

Em seu terminal/prompt execute:

```shell
# Instale as dependências
npm install
```

Em seguida, renomeie o arquivo `.env.development.example` para `.env` e execute esse comando abrir o web aplicativo e entrar no modo de desenvolvimento:

```shell
npm run dev
```

Você verá informações semelhantes à essa como saída no seu terminal/prompt:

```
  VITE v5.4.11  ready in 181 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Então, é só acessar em seu navegador a URL: http://localhost:5174/

### Produção

Para gerar os arquivos que serão publicados no servidor, utilize o comando abaixo:

```
npm run build
```

Os arquivos estaticos estarão disponíveis no diretório `dist/`, seu gerenciador de requisições (nginx/apache) deve apontar para esse diretório e abrir o arquivo `index.html`.

## Variáveis de ambiente

Nesse projeto consta as váriaveis que fazem referência ao ambiente de produção como você pode ser no arquivo `.env.development.example`, altere de acordo com respectivo ambiente de trabalho (localhost por exemplo): 

```
VITE_PUBLIC_BASE_URL=
VITE_PUBLIC_API_URL=https://api.myelevate.ai/api
IA_API_TOKEN=
VITE_PUBLIC_IA_URL="https://ia.betgpt.com.br"
```

## Diretórios

* `public/`: local onde estão os arquivos estáticos, onde serão servidor pelo servidor web (nginx/apache).
* `src/assets/`: diretório também para arquivos estáticos
* `src/boot`: Deixe nesse diretório arquivos que você deseja quem iniciem primeiro que os ciclos de vida do Vue e importe no arquivo `main.js`
* `src/components/`:
  * `custom/`: existem componentes que podem ser modificados de acordo com a necessidade, para isso construa-os aqui.
  * `ui`: são os componentes da biblioteca [shadcn](https://www.shadcn-vue.com/), recomenda-se que não seja alterado.
* `src/filters/`: os filtros permitem que você modifique alguma informação para que seja visível de acordo com o contexto do usuário, como por exemplo um valor flutuante para a moeda local (USD, BRL, etc.)
* `src/langs/`: arquivos de idiomas
* `src/layouts/`: templates vue para tipos de layout, os layouts permitem definir estruturas customizadas de componentes para o usuário.
* `src/lib/`: crie recursos utilitários como mesclar classes css em componentes de interface por exemplo.
* `src/router/`: diretório configuração de rotas/URLs do aplicativo como também as restrições de acesso.
* `src/services/`: diretório para acesso aos recursos remotos (API RESTful)
* `src/stores/`: diretório para o gerenciamento de estado do Vue usando a biblioteca Pinia
* `src/views/`: este diretório fica os arquivos de visualização onde o usuário interage
  * `auth/`: responsável pelas interações que envolve autenticação, recuperação e cadastro
  * `configurations/`: diretório para configurações dos recursos inerentes ao usuário, como: projetos, perfil, subcontas, etc.
  * `dashboard/`: são páginas para obter informações de determinados recursos, visto que esse é um aplicativo análico, será possível visualizar gráficos, listas e indicadores.













This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
