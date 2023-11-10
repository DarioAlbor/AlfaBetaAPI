const axios = require('axios');
const fs = require('fs');
const AdmZip = require('adm-zip');

const usuario = 'NOMBRE DE USUARIO';
const contrasena = 'CONTRASEÑA';

const urlBase = 'http://web.alfabeta.net/update';

function leerUltimoArchivo(tipo) {
    try {
        const contenido = fs.readFileSync(`valores${tipo}.txt`, 'utf8');
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

function guardarEnArchivo(valores, tipo) {
    const contenido = Object.entries(valores).map(([key, value]) => `${key}: ${value}`).join('\n');
    fs.writeFileSync(`valores${tipo}.txt`, contenido);
}

function descargarArchivo(tipo, id) {
    const parametros = `usr=${usuario}&pw=${contrasena}&src=${tipo}&id=${id}`;
    const url = `${urlBase}?${parametros}`;

    axios.get(url, { responseType: 'arraybuffer' })
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

                guardarEnArchivo(valores, tipo);

                const nombreArchivo = respuesta.headers['content-disposition'].split('=')[1];
                const archivoPath = `./files/${tipo}/Zip/${nombreArchivo}`;

                fs.writeFileSync(archivoPath, respuesta.data);

                // Descomprimir el archivo
                const zip = new AdmZip(archivoPath);
                zip.extractAllTo(`RUTA DONDE QUIERES EXTRAER EL MANUAL.DAT`, true);

                console.log(`${nombreArchivo} descargado y descomprimido.`);
            } else {
                console.error(`Error al descargar el archivo. Status Code: ${status}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function descargarManual(tipo) {
    const ultimoArchivo = leerUltimoArchivo(tipo);

    if (ultimoArchivo) {
        descargarArchivo(tipo, ultimoArchivo.numero);
    } else {
        console.log(`No se pudo obtener el último archivo descargado. Verifica el archivo valores${tipo}.txt.`);
    }
}

descargarManual('MD');