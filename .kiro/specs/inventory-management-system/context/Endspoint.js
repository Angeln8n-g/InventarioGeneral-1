// Lógica del endpoint
async function loanTool(req, res) {
    const { qrCode, userId } = req.body;
    const connection = await mysql.getConnection();

    try {
        // Iniciar transacción
        await connection.beginTransaction();

        // 1. Encontrar la herramienta y bloquear la fila
        const [toolRows] = await connection.execute(
            'SELECT * FROM item_instances WHERE qr_code = ? FOR UPDATE',
            [qrCode]
        );
        const tool = toolRows[0];

        if (!tool) {
            await connection.rollback();
            return res.status(404).json({ error: 'Herramienta no encontrada' });
        }

        // 2. Validar disponibilidad
        if (tool.status !== 'available') {
            await connection.rollback();
            return res.status(409).json({ 
                error: `Herramienta no disponible. Estado actual: ${tool.status}` 
            });
        }

        // 3. Crear el préstamo
        await connection.execute(
            'INSERT INTO loans (user_id, item_instance_id) VALUES (?, ?)',
            [userId, tool.id]
        );

        // 4. Actualizar el estado de la herramienta
        await connection.execute(
            'UPDATE item_instances SET status = ?, last_user_id = ? WHERE id = ?',
            ['loaned', userId, tool.id]
        );

        // Confirmar transacción
        await connection.commit();
        res.status(201).json({ success: true, message: `Herramienta "${tool.name}" prestada.` });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        connection.release();
    }
}