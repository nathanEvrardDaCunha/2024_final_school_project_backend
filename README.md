# 2024_final_school_project_backend### Instructions :- Run : npm install- Run : npx prisma generate- Create a .env- Adapt the .env.example to .env- Run : docker-compose build- Run : docker-compose up- Run : npx prisma migrate dev --name init- Run : npx prisma migrate deploy### Problems with docker :- Run : rm  ~/.docker/config.json- Run : docker-compose build### Problem with Stripe webhook :- Run : stripe listen --forward-to localhost:3000/stripe/webhook- Run : stripe trigger payment_intent.succeededCheck that your webhook on your stripe dashboard is "listening"