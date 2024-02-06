export const generateUserErrorInfo = (user) => {
    return `Una o más propiedades fueron enviadas incompletas o no son válidas.
        Lista de propiedades requeridas:
            * fist_name: type String, recibido: ${user.first_name}
            * last_name: type String, recibido: ${user.last_name}
            * email: type String, recibido: ${user.email}
            * age: type Number, recibido: ${user.age}
            * password: type String, recibido: ${user.password}
    `;
};