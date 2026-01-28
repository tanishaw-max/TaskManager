import User from '../models/User.js';
import Role from '../models/Role.js';
import jwt from 'jsonwebtoken';

export const register=async(req,res)=>{
    try{
        const {username,email,password,phone,address,roleId}=req.body;

        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"Email already exists"});
        }
        const newUser=new User({
            username,
            email,
            password,
            phone,
            address,
            roleId
        });
        await newUser.save();
        res.status(201).json({message:"User registered successfully"});
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message})
    }
};

export const login=async(req,res)=>{
    try{
            const {email,password}=req.body;

            const user=await User.findOne({email})
            if(!user){
                return res.status(400).json({message:"Invalid email or password"});
            }

            const isMatch=await user.comparePassword(password);
            if(!isMatch){
                return res.status(400).json({message:"Invalid email or password"});
            }

            const token=jwt.sign({
                userId:user._id,
                email:user.email},process.env.JWT_SECRET,{expiresIn:'1h'});

            res.status(200).json({message:"Login Successful",
                token,
            user:{
                id:user._id,
                username:user.username,
                email:user.email
            }});


           
    }catch(error){       
         res.status(500).json({message:"Server error",error:error.message})
    }

};
        