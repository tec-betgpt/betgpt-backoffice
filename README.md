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

## Arquivos de vídeo

Tornar um sistema atraente pode envolver arquivos de vídeos, isso permite chamar a atenção do usuário para algum interesse ou propósito. Pelo motivo natural de arquivos de vídeo precisar de maior banda de rede e espaço em disco, os arquivos devem ser servidos de arquivos com o dispositivo, por exemplo: um dispositivo smartphone deve receber arquivos com 480p ou 240p de resolução, invés de full-hd (1080p).

Então, é recomendável que você tenha um arquivo original em full-hd (1920 x 1080 pixels) como padrão máximo de qualidade e converta para formatos e dimensões para atender aos demais dispositivos.

> É recomendável que você tenha o `ffmpeg` instalado em seu sistema (considerando que você esteja usando o linux)
> 

Para realizar as conversões, use o seguinte comando:

```shell
ffmpeg -i login.mp4 -vf "scale=1280:720" login-720p.mp4 &&
ffmpeg -i login.mp4 -vf "scale=854:480" login-480p.mp4 &&
ffmpeg -i login.mp4 -vf "scale=640:360" login-360p.mp4 &&
ffmpeg -i login.mp4 -vf "scale=426:240" login-240p.mp4 &&
ffmpeg -i login.mp4 -c:v libvpx-vp9 -b:v 1M -c:a libopus login.webm &&
ffmpeg -i login.mp4 -vf "scale=1280:720" -c:v libvpx-vp9 -b:v 1M -c:a libopus login-720p.webm &&
ffmpeg -i login.mp4 -vf "scale=854:480" -c:v libvpx-vp9 -b:v 1M -c:a libopus login-480p.webm &&
ffmpeg -i login.mp4 -vf "scale=640:360" -c:v libvpx-vp9 -b:v 1M -c:a libopus login-360p.webm &&
ffmpeg -i login.mp4 -vf "scale=426:240" -c:v libvpx-vp9 -b:v 1M -c:a libopus login-240p.webm &&
ffmpeg -i login.mp4 -ss 00:00:03 -vframes 1 poster.jpg
```

Esse comando acima faz o seguinte:

1. Converte o arquivo original `login.mp4` para as resoluções 720p, 480p, 360p e 240p
2. Cria uma cópia do arquivo original em `.mp4` para `.webm`
3. Converte o arquivo original para várias resoluções em formato `.webm`
4. Gera uma captura do vídeo após os três segundos para servir como imagem de prévia na tag `<video>`.

Após essas conversões, distribua os arquivos nas respectivas pastas: `mpeg/`, `webm/` e `poster/`.

Esses arquivos podem ser usados diretamente na tag `<video />`, mas recomendo usar o plugin para `Vue`: [vue-responsive-video-background-player](https://github.com/avidofood/vue-responsive-video-background-player) e com a seguinte configuração:

```vue
<video-background
  src="/movies/mpeg/login.mp4"
  poster="/movies/poster/login.jpg"
  style="width: 100%; position:absolute; top: 0; left: 0; height: 100%;"
  :playsinline="true"
  :sources="[
    { src: '/movies/mpeg/login_720p.mp4', res: 1200, autoplay: true, type: 'video/mp4' },
    { src: '/movies/mpeg/login_480p.mp4', res: 800, autoplay: true, type: 'video/mp4' },
    { src: '/movies/mpeg/login_360p.mp4', res: 600, autoplay: true, type: 'video/mp4' },
    { src: '/movies/mpeg/login_240p.mp4', res: 400, autoplay: true, type: 'video/mp4' },
    { src: '/movies/webm/login_720p.webm', res: 1200, autoplay: true, type: 'video/webm' },
    { src: '/movies/webm/login_480p.webm', res: 800, autoplay: true, type: 'video/webm' },
    { src: '/movies/webm/login_360p.webm', res: 600, autoplay: true, type: 'video/webm' },
    { src: '/movies/webm/login_240p.webm', res: 400, autoplay: true, type: 'video/webm' },
  ]"
/>
```

Dessa forma, é possível manter a página visualmente atraente sem perder a performance e desperdício de dados do Cliente.
