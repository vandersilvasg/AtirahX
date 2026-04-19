DO $$
DECLARE
    v_user_record RECORD;
    v_profile_exists BOOLEAN;
BEGIN
    -- Busca o usuário pelo email na tabela de autenticação
    SELECT * INTO v_user_record FROM auth.users WHERE email = 'vandersilvasg@gmail.com';

    IF v_user_record.id IS NOT NULL THEN
        -- Verifica se já existe perfil
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE auth_user_id = v_user_record.id) INTO v_profile_exists;

        IF NOT v_profile_exists THEN
            -- Cria o perfil se não existir
            INSERT INTO public.profiles (
                id,
                auth_user_id,
                name,
                email,
                role,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_user_record.id,
                'Vander Silva', -- Nome padrão
                v_user_record.email,
                'owner', -- Role 'owner' para acesso total
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Perfil criado com sucesso para o usuário %', v_user_record.email;
        ELSE
            RAISE NOTICE 'O perfil já existe para o usuário %', v_user_record.email;
        END IF;
    ELSE
        RAISE NOTICE 'Usuário com email vandersilvasg@gmail.com não encontrado em auth.users';
    END IF;
END $$;
