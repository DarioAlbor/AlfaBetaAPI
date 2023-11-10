const axios = require('axios');
const fs = require('fs');

const usuario = 'NOMBRE DE USUARIO';
const contrasena = 'CONTRASEÑA';

const urlBase = 'http://web.alfabeta.net/update';

function leerUltimoArchivo() {
    try {
        const contenido = fs.readFileSync('valoresME.txt', 'utf8');
        const lineas = contenido.split('\n');

        for (let i = lineas.length - 1; i >= 0; i--) {
            const matchNumero = lineas[i].match(/^NUMERO: (\d+)$/);
            if (matchNumero) {
                return {
                    indice: i,
                    numero: matchNumero[1]
                };
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}

function guardarEnArchivo(valores) {
    const contenido = Object.entries(valores).map(([key, value]) => `${key}: ${value}`).join('\n');
    fs.writeFileSync('valoresME.txt', contenido);
}

function descargarArchivo(src, id) {
    const parametros = `usr=${usuario}&pw=${contrasena}&src=${src}&id=${id}`;
    const url = `${urlBase}?${parametros}`;

    axios.get(url, { responseType: 'stream' })
        .then(respuesta => {
            const status = respuesta.status;

            if (status === 200) {
                const valores = {
                    NUMERO: respuesta.headers['numero'],
                    TIPO: respuesta.headers['tipo'],
                    TIPO_ACTUALIZACION: respuesta.headers['tipo_actualizacion'],
                    Content_Disposition: respuesta.headers['content-disposition'],
                    Content_Length: respuesta.headers['content-length']
                };

                guardarEnArchivo(valores);

                const nombreArchivo = respuesta.headers['content-disposition'].split('=')[1];
                const archivoStream = fs.createWriteStream(`./files/ME/${nombreArchivo}`);
                respuesta.data.pipe(archivoStream);

                respuesta.data.on('end', () => {
                    console.log(`${nombreArchivo} descargado.`);
                });
            } else {
                console.error(`Error al descargar el archivo. Status Code: ${status}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function descargarManualExtra() {
    const ultimoArchivo = leerUltimoArchivo();

    if (ultimoArchivo) {
        descargarArchivo('ME', ultimoArchivo.numero);
    } else {
        console.log('No se pudo obtener el último archivo descargado. Verifica el archivo valoresME.txt.');
    }
}

descargarManualExtra();